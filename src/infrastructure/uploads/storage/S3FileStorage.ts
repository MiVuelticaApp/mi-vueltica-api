import { Readable } from "stream";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { IFileStorage, StoredFileInfo } from "@/domain/uploads/services/IFileStorage";
import FileStorageError from "@/infrastructure/core/errors/FileStorageError";

export interface S3StorageConfig {
  /** Full endpoint URL, e.g. `http://seaweedfs:8333`. */
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** `http://host/bucket/key` instead of `http://bucket.host/key`. Needed by SeaweedFS (and MinIO). */
  forcePathStyle: boolean;
}

const NOT_FOUND_NAMES = new Set(["NotFound", "NoSuchKey", "NoSuchBucket"]);

const isNotFound = (error: unknown) => {
  if (typeof error !== "object" || error === null) return false;
  const { name, $metadata } = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return NOT_FOUND_NAMES.has(name ?? "") || $metadata?.httpStatusCode === 404;
};

/**
 * Object storage through the S3 API. The project runs SeaweedFS (its S3 gateway), but any
 * S3-compatible server works. The bucket stays private: there is no public policy and no
 * pre-signed URL, every read goes through the API (`GET /api/v1/files/:id`).
 */
export default class S3FileStorage implements IFileStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3StorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      // Newer SDKs add CRC32 checksums to every request by default; S3-compatible servers do
      // not all support them, so only send/validate them when the operation requires it.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
    this.bucket = config.bucket;
  }

  async ensureReady(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      if (!isNotFound(error)) throw new FileStorageError(`Could not reach bucket "${this.bucket}"`, error);
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        console.log(`[storage] created bucket "${this.bucket}"`);
      } catch (createError) {
        throw new FileStorageError(`Could not create bucket "${this.bucket}"`, createError);
      }
    }
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    try {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: body.length,
      }));
    } catch (error) {
      console.error(`[storage] could not store ${key}:`, error);
      throw new FileStorageError("No se pudo guardar el archivo, intenta de nuevo más tarde", error);
    }
  }

  async stat(key: string): Promise<StoredFileInfo | null> {
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return {
        size: head.ContentLength ?? 0,
        contentType: head.ContentType ?? "application/octet-stream",
        etag: (head.ETag ?? "").replace(/"/g, ""),
        lastModified: head.LastModified ?? new Date(0),
      };
    } catch (error) {
      if (isNotFound(error)) return null;
      console.error(`[storage] could not stat ${key}:`, error);
      throw new FileStorageError("No se pudo leer el archivo, intenta de nuevo más tarde", error);
    }
  }

  async open(key: string): Promise<Readable | null> {
    try {
      const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      // In Node.js the SDK's body is an IncomingMessage, i.e. a Readable.
      return object.Body as Readable;
    } catch (error) {
      if (isNotFound(error)) return null;
      console.error(`[storage] could not read ${key}:`, error);
      throw new FileStorageError("No se pudo leer el archivo, intenta de nuevo más tarde", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // S3 DeleteObject already succeeds for a missing key.
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      if (isNotFound(error)) return;
      throw new FileStorageError(`Could not delete ${key}`, error);
    }
  }
}
