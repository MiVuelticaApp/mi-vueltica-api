import { Readable } from "stream";
import { Upload } from "@/domain/uploads/entities/Upload";
import { StoredFileInfo } from "@/domain/uploads/services/IFileStorage";

export interface UploadedFile {
  upload: Upload;
  /** Durable URL served by the API (`GET /files/:id`). */
  url: string;
}

/** A URL that points at one of our uploads, rewritten to its canonical form. */
export interface ResolvedUpload {
  uploadId: string;
  url: string;
}

export interface UploadServiceConfig {
  /** Absolute URL that file ids are appended to, e.g. `https://api.example.com/api/v1/files`. */
  fileUrlPrefix: string;
  /** Unreferenced uploads younger than this are never cleaned up (the client may still attach them). */
  orphanGraceMs: number;
}

export interface IUploadService {
  /** Validates/normalizes the image, stores it in object storage and records it. */
  upload(userId: string, file: Buffer): Promise<UploadedFile>;
  urlFor(uploadId: string): string;
  /** The upload id if `url` has the shape of one of our file URLs (whatever the host), else null. */
  uploadIdFromUrl(url: string): string | null;
  /**
   * Every URL must be an existing upload of `userId` (422 `InvalidUploadError` otherwise).
   * Returns them in the same order, with canonical URLs.
   */
  resolveOwnUploads(userId: string, urls: string[]): Promise<ResolvedUpload[]>;
  /**
   * For moderator-supplied URLs: null when `url` is not one of our file URLs (an external URL);
   * the resolved upload when it is; 422 when it looks like ours but the upload does not exist.
   */
  resolveUrl(url: string): Promise<ResolvedUpload | null>;
  /** Throws `FileNotFoundError` (404). */
  getFileInfo(uploadId: string): Promise<StoredFileInfo>;
  /** Throws `FileNotFoundError` (404). */
  openFile(uploadId: string): Promise<Readable>;
  /**
   * Deletes uploads that no Photo, Submission or Review references and are older than the grace period:
   * the row first (conditionally), then the object. Returns how many were removed.
   */
  cleanupOrphans(now?: Date): Promise<number>;
}
