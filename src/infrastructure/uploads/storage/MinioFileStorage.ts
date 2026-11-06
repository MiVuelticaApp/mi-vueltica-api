import { Readable } from "stream";
import { Client } from "minio";
import { IFileStorage, StoredFileInfo } from "@/domain/uploads/services/IFileStorage";
import FileStorageError from "@/infrastructure/core/errors/FileStorageError";

export interface MinioConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region?: string;
}

const NOT_FOUND_CODES = new Set(["NotFound", "NoSuchKey", "NoSuchObject"]);

const isNotFound = (error: unknown) =>
  typeof error === "object" && error !== null && NOT_FOUND_CODES.has((error as { code?: string }).code ?? "");

/**
 * MinIO-backed object storage. The bucket stays private: there is no public policy and no
 * pre-signed URL, every read goes through the API (`GET /api/v1/files/:id`).
 */
export default class MinioFileStorage implements IFileStorage {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(config: MinioConfig) {
    this.client = new Client({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });
    this.bucket = config.bucket;
    this.region = config.region ?? "us-east-1";
  }

  async ensureReady(): Promise<void> {
    try {
      if (!(await this.client.bucketExists(this.bucket))) {
        await this.client.makeBucket(this.bucket, this.region);
        console.log(`[storage] created bucket "${this.bucket}"`);
      }
    } catch (error) {
      throw new FileStorageError(`Could not prepare bucket "${this.bucket}"`, error);
    }
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    try {
      await this.client.putObject(this.bucket, key, body, body.length, { "Content-Type": contentType });
    } catch (error) {
      console.error(`[storage] could not store ${key}:`, error);
      throw new FileStorageError("No se pudo guardar el archivo, intenta de nuevo más tarde", error);
    }
  }

  async stat(key: string): Promise<StoredFileInfo | null> {
    try {
      const stat = await this.client.statObject(this.bucket, key);
      const metaData = stat.metaData as Record<string, string | undefined>;
      return {
        size: stat.size,
        contentType: metaData["content-type"] ?? "application/octet-stream",
        etag: stat.etag.replace(/"/g, ""),
        lastModified: stat.lastModified,
      };
    } catch (error) {
      if (isNotFound(error)) return null;
      console.error(`[storage] could not stat ${key}:`, error);
      throw new FileStorageError("No se pudo leer el archivo, intenta de nuevo más tarde", error);
    }
  }

  async open(key: string): Promise<Readable | null> {
    try {
      return await this.client.getObject(this.bucket, key);
    } catch (error) {
      if (isNotFound(error)) return null;
      console.error(`[storage] could not read ${key}:`, error);
      throw new FileStorageError("No se pudo leer el archivo, intenta de nuevo más tarde", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key);
    } catch (error) {
      if (isNotFound(error)) return;
      throw new FileStorageError(`Could not delete ${key}`, error);
    }
  }
}
