import { Upload } from "@/domain/uploads/entities/Upload";
import { Upload as PrismaUpload } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaUploadMapper {
  static toDomain(row: PrismaUpload): Upload {
    return new Upload({
      id: row.id,
      userId: row.userId,
      objectKey: row.objectKey,
      contentType: row.contentType,
      size: row.size,
      width: row.width,
      height: row.height,
      createdAt: row.createdAt,
    });
  }
}
