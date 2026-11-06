import { GalleryPhoto, Photo } from "@/domain/photos/entities/Photo";
import { PhotoOwner } from "@/domain/photos/valueObjects/photoOwner.valueObject";
import { Photo as PrismaPhoto, Prisma } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaPhotoMapper {
  static toDomain(row: PrismaPhoto): Photo {
    const owner = PrismaPhotoMapper.ownerOf(row);
    return new Photo({
      id: row.id,
      owner,
      url: row.url,
      position: row.position,
      uploadId: row.uploadId,
      createdAt: row.createdAt,
    });
  }

  /**
   * Exactly one of placeId / eventId must be set. The database cannot enforce it (MySQL 8 refuses
   * a CHECK on columns with FK referential actions), so a broken row fails loudly here.
   */
  private static ownerOf(row: PrismaPhoto): PhotoOwner {
    if (row.placeId && !row.eventId) return { type: "PLACE", id: row.placeId };
    if (row.eventId && !row.placeId) return { type: "EVENT", id: row.eventId };
    throw new Error(`Photo ${row.id} must belong to exactly one place or event`);
  }

  static toGalleryPhoto(row: PrismaPhoto): GalleryPhoto {
    return { id: row.id, url: row.url, position: row.position };
  }

  static ownerWhere(owner: PhotoOwner): Prisma.PhotoWhereInput {
    return owner.type === "PLACE" ? { placeId: owner.id } : { eventId: owner.id };
  }
}
