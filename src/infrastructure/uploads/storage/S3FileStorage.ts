import { Readable } from "stream";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
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

/** What to do about the most common S3 errors, so the boot log says how to fix it. */
const HINTS: Record<string, string> = {
  InvalidAccessKeyId: "S3_ACCESS_KEY is not an identity known to the S3 server (check its s3 config / identities).",
  SignatureDoesNotMatch:
    "S3_SECRET_KEY is wrong, or a reverse proxy in front of the S3 server changes the Host header or the request " +
    "(point S3_ENDPOINT at the internal service, e.g. http://seaweedfs:8333, instead of a public domain).",
  AccessDenied: "the identity lacks permissions: it needs Admin (to create the bucket) or Read, Write and List on it.",
  RequestTimeTooSkewed: "the API server's clock is too far from the S3 server's clock.",
};

/**
 * One-line description of an S3 SDK error: `Code (HTTP status): message`, plus a hint for the
 * common ones. HEAD responses have no body, so for them the SDK can only say `UnknownError`.
 */
export function describeS3Error(error: unknown): string {
  if (typeof error !== "object" || error === null) return String(error);
  const { name, message, $metadata } = error as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
  const status = $metadata?.httpStatusCode;
  const code = name ?? "Error";
  const detail = message && message !== code && message !== "UnknownError" ? `: ${message}` : "";
  const hint = HINTS[code] ? ` → ${HINTS[code]}` : "";
  return `${code}${status ? ` (HTTP ${status})` : ""}${detail}${hint}`;
}

/**
 * Object storage through the S3 API. The project runs SeaweedFS (its S3 gateway), but any
 * S3-compatible server works. The bucket stays private: there is no public policy and no
 * pre-signed URL, every read goes through the API (`GET /api/v1/files/:id`).
 */
export default class S3FileStorage implements IFileStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

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
    this.endpoint = config.endpoint;
  }

  async ensureReady(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch (error) {
      if (!isNotFound(error)) {
        // HEAD responses carry no error body, so a 403 is just "UnknownError". Repeat the check
        // as a GET (list one key), whose XML error says why: bad key, bad signature, no permission.
        const reason = await this.explainBucketAccessError(error);
        throw new FileStorageError(`Could not access bucket "${this.bucket}" at ${this.endpoint}: ${reason}`, error);
      }
    }
    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      console.log(`[storage] created bucket "${this.bucket}"`);
    } catch (createError) {
      throw new FileStorageError(
        `Could not create bucket "${this.bucket}" at ${this.endpoint}: ${describeS3Error(createError)}`,
        createError,
      );
    }
  }

  private async explainBucketAccessError(headError: unknown): Promise<string> {
    try {
      await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 }));
      // Listing works but HEAD did not: report the HEAD error as it is.
      return describeS3Error(headError);
    } catch (listError) {
      return describeS3Error(listError);
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
      console.error(`[storage] could not store ${key}: ${describeS3Error(error)}`);
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
      console.error(`[storage] could not stat ${key}: ${describeS3Error(error)}`);
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
      console.error(`[storage] could not read ${key}: ${describeS3Error(error)}`);
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
