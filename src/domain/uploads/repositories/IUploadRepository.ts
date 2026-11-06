import { Upload } from "@/domain/uploads/entities/Upload";

export interface NewUpload {
  id: string;
  userId: string;
  objectKey: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
}

export interface IUploadRepository {
  create(data: NewUpload): Promise<Upload>;
  find(id: string): Promise<Upload | null>;
  /** The uploads with these ids that exist (any order). */
  findByIds(ids: string[]): Promise<Upload[]>;
  /**
   * Uploads created before `createdBefore` that no Photo and no Submission references,
   * oldest first.
   */
  findOrphans(createdBefore: Date, limit: number): Promise<Upload[]>;
  /**
   * Deletes the row only if it is still unreferenced (single conditional statement, so an
   * upload attached in the meantime is kept). Returns whether it was deleted.
   */
  deleteIfOrphan(id: string): Promise<boolean>;
}
