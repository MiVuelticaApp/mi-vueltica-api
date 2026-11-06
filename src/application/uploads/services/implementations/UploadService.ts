import { Readable } from "stream";
import { uploadObjectKey } from "@/domain/uploads/entities/Upload";
import { IUploadRepository } from "@/domain/uploads/repositories/IUploadRepository";
import { IFileStorage, StoredFileInfo } from "@/domain/uploads/services/IFileStorage";
import { IImageProcessor } from "@/domain/uploads/services/IImageProcessor";
import { IIDGenerator } from "@/domain/core/services/IIDGenerator";
import {
  IUploadService,
  ResolvedUpload,
  UploadedFile,
  UploadServiceConfig,
} from "../interfaces/IUploadService";
import { FileNotFoundError } from "../../errors/FileNotFoundError";
import { InvalidUploadError } from "../../errors/InvalidUploadError";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLEANUP_BATCH_SIZE = 100;

export class UploadService implements IUploadService {
  private readonly fileUrlPrefix: string;
  private readonly filesPathname: string;

  constructor(
    private readonly uploadRepository: IUploadRepository,
    private readonly fileStorage: IFileStorage,
    private readonly imageProcessor: IImageProcessor,
    private readonly idGenerator: IIDGenerator,
    private readonly config: UploadServiceConfig,
  ) {
    this.fileUrlPrefix = config.fileUrlPrefix.replace(/\/+$/, "");
    this.filesPathname = new URL(this.fileUrlPrefix).pathname;
  }

  async upload(userId: string, file: Buffer): Promise<UploadedFile> {
    const image = await this.imageProcessor.process(file);
    const id = this.idGenerator.generate();
    const objectKey = uploadObjectKey(id);

    await this.fileStorage.put(objectKey, image.body, image.contentType);
    try {
      const upload = await this.uploadRepository.create({
        id,
        userId,
        objectKey,
        contentType: image.contentType,
        size: image.body.length,
        width: image.width,
        height: image.height,
      });
      return { upload, url: this.urlFor(id) };
    } catch (error) {
      // Without its row the object would never be cleaned up.
      await this.fileStorage.delete(objectKey).catch((cleanupError) =>
        console.error(`[uploads] could not remove object ${objectKey} after a failed insert:`, cleanupError),
      );
      throw error;
    }
  }

  urlFor(uploadId: string): string {
    return `${this.fileUrlPrefix}/${uploadId}`;
  }

  uploadIdFromUrl(url: string): string | null {
    let pathname: string;
    try {
      pathname = new URL(url).pathname;
    } catch {
      return null;
    }
    const prefix = `${this.filesPathname}/`;
    if (!pathname.startsWith(prefix)) return null;
    const id = pathname.slice(prefix.length);
    return UUID.test(id) ? id.toLowerCase() : null;
  }

  async resolveOwnUploads(userId: string, urls: string[]): Promise<ResolvedUpload[]> {
    if (urls.length === 0) return [];
    const ids = urls.map((url) => {
      const id = this.uploadIdFromUrl(url);
      if (!id) throw new InvalidUploadError(`Foto inválida (${url}): usa una URL devuelta por POST /uploads`);
      return id;
    });
    if (new Set(ids).size !== ids.length) throw new InvalidUploadError("photos no puede repetir la misma foto");

    const uploads = new Map((await this.uploadRepository.findByIds(ids)).map((upload) => [upload.id, upload]));
    return ids.map((id, index) => {
      const upload = uploads.get(id);
      // Someone else's upload is reported exactly like a missing one.
      if (!upload || !upload.belongsTo(userId)) {
        throw new InvalidUploadError(`Foto inválida (${urls[index]}): no existe o no es tuya`);
      }
      return { uploadId: id, url: this.urlFor(id) };
    });
  }

  async resolveUrl(url: string): Promise<ResolvedUpload | null> {
    const id = this.uploadIdFromUrl(url);
    if (!id) return null;
    if (!(await this.uploadRepository.find(id))) throw new InvalidUploadError("La foto subida no existe");
    return { uploadId: id, url: this.urlFor(id) };
  }

  async getFileInfo(uploadId: string): Promise<StoredFileInfo> {
    const info = await this.fileStorage.stat(uploadObjectKey(uploadId));
    if (!info) throw new FileNotFoundError();
    return info;
  }

  async openFile(uploadId: string): Promise<Readable> {
    const stream = await this.fileStorage.open(uploadObjectKey(uploadId));
    if (!stream) throw new FileNotFoundError();
    return stream;
  }

  async cleanupOrphans(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - this.config.orphanGraceMs);
    let removed = 0;
    // Batches until nothing is left; a batch where nothing could be removed ends the run so a
    // persistent failure never loops forever.
    for (;;) {
      const orphans = await this.uploadRepository.findOrphans(cutoff, CLEANUP_BATCH_SIZE);
      let removedInBatch = 0;
      for (const upload of orphans) {
        try {
          // Row first: if it was attached in the meantime the conditional delete keeps it,
          // and the object is only removed once nothing can reference it anymore.
          if (!(await this.uploadRepository.deleteIfOrphan(upload.id))) continue;
          removedInBatch += 1;
          await this.fileStorage.delete(upload.objectKey);
        } catch (error) {
          console.error(`[uploads] could not clean up upload ${upload.id}:`, error);
        }
      }
      removed += removedInBatch;
      if (orphans.length < CLEANUP_BATCH_SIZE || removedInBatch === 0) return removed;
    }
  }
}
