import { Upload } from "@/domain/uploads/entities/Upload";
import { IUploadRepository, NewUpload } from "@/domain/uploads/repositories/IUploadRepository";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaUploadMapper } from "../mappers/PrismaUploadMapper";

/** Neither a Photo nor a Submission references the upload. */
const UNREFERENCED: Prisma.UploadWhereInput = { photos: { none: {} }, submissions: { none: {} } };

export default class PrismaUploadRepository implements IUploadRepository {
  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async create(data: NewUpload): Promise<Upload> {
    try {
      return PrismaUploadMapper.toDomain(await this.client.upload.create({ data }));
    } catch (error) {
      console.error("Error creating upload:", error);
      throw new DatabaseInsertError("Could not create upload", error);
    }
  }

  async find(id: string): Promise<Upload | null> {
    try {
      const row = await this.client.upload.findUnique({ where: { id } });
      return row ? PrismaUploadMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding upload:", error);
      throw new DatabaseError("Could not find upload", error);
    }
  }

  async findByIds(ids: string[]): Promise<Upload[]> {
    if (ids.length === 0) return [];
    try {
      const rows = await this.client.upload.findMany({ where: { id: { in: ids } } });
      return rows.map(PrismaUploadMapper.toDomain);
    } catch (error) {
      console.error("Error finding uploads:", error);
      throw new DatabaseError("Could not find uploads", error);
    }
  }

  async findOrphans(createdBefore: Date, limit: number): Promise<Upload[]> {
    try {
      const rows = await this.client.upload.findMany({
        where: { createdAt: { lt: createdBefore }, ...UNREFERENCED },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: limit,
      });
      return rows.map(PrismaUploadMapper.toDomain);
    } catch (error) {
      console.error("Error finding orphan uploads:", error);
      throw new DatabaseError("Could not find orphan uploads", error);
    }
  }

  async deleteIfOrphan(id: string): Promise<boolean> {
    try {
      // One statement, so a reference added after `findOrphans` keeps the row (Prisma's
      // deleteMany with relation filters would read first and delete afterwards).
      const count = await this.client.$executeRaw`
        DELETE FROM Upload
        WHERE id = ${id}
          AND NOT EXISTS (SELECT 1 FROM Photo WHERE uploadId = ${id})
          AND NOT EXISTS (SELECT 1 FROM SubmissionUpload WHERE uploadId = ${id})
      `;
      return count > 0;
    } catch (error) {
      console.error("Error deleting orphan upload:", error);
      throw new DatabaseInsertError("Could not delete orphan upload", error);
    }
  }
}
