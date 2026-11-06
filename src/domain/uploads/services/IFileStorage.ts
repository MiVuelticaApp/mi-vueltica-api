import { Readable } from "stream";

export interface StoredFileInfo {
  size: number;
  contentType: string;
  /** Opaque entity tag, without quotes. */
  etag: string;
  lastModified: Date;
}

/**
 * S3-compatible object storage (SeaweedFS in every environment). Only the API talks to it: files are uploaded
 * through `POST /uploads` and served through `GET /files/:id`.
 *
 * @see src/infrastructure/uploads/storage/S3FileStorage.ts
 */
export interface IFileStorage {
  /** Creates the bucket if it does not exist. Called once at boot. */
  ensureReady(): Promise<void>;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Null when the object does not exist. */
  stat(key: string): Promise<StoredFileInfo | null>;
  /** Null when the object does not exist. */
  open(key: string): Promise<Readable | null>;
  /** Idempotent: deleting a missing object is not an error. */
  delete(key: string): Promise<void>;
}
