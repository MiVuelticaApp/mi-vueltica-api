import { GalleryPhoto, Photo } from "@/domain/photos/entities/Photo";
import { PhotoOwner } from "@/domain/photos/valueObjects/photoOwner.valueObject";
import { Photo as PrismaPhoto, Prisma } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaPhotoMapper {
  static toDomain(row: PrismaPhoto): Photo {
    // The CHECK constraint guarantees exactly one of placeId / eventId is set.
    const owner: PhotoOwner = row.placeId ? { type: "PLACE", id: row.placeId } : { type: "EVENT", id: row.eventId! };
    return new Photo({
      id: row.id,
      owner,
      url: row.url,
      position: row.position,
      uploadId: row.uploadId,
      createdAt: row.createdAt,
    });
  }

  static toGalleryPhoto(row: PrismaPhoto): GalleryPhoto {
    return { id: row.id, url: row.url, position: row.position };
  }

  static ownerWhere(owner: PhotoOwner): Prisma.PhotoWhereInput {
    return owner.type === "PLACE" ? { placeId: owner.id } : { eventId: owner.id };
  }
}
