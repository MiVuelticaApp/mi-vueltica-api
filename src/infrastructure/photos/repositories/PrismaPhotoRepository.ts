import { Photo } from "@/domain/photos/entities/Photo";
import { IPhotoRepository, NewPhoto } from "@/domain/photos/repositories/IPhotoRepository";
import { PhotoOwner } from "@/domain/photos/valueObjects/photoOwner.valueObject";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaPhotoMapper } from "../mappers/PrismaPhotoMapper";

export default class PrismaPhotoRepository implements IPhotoRepository {
  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async listByOwner(owner: PhotoOwner): Promise<Photo[]> {
    try {
      const rows = await this.client.photo.findMany({
        where: PrismaPhotoMapper.ownerWhere(owner),
        orderBy: [{ position: "asc" }, { id: "asc" }],
      });
      return rows.map(PrismaPhotoMapper.toDomain);
    } catch (error) {
      console.error("Error listing photos:", error);
      throw new DatabaseError("Could not list photos", error);
    }
  }

  async find(id: string): Promise<Photo | null> {
    try {
      const row = await this.client.photo.findUnique({ where: { id } });
      return row ? PrismaPhotoMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding photo:", error);
      throw new DatabaseError("Could not find photo", error);
    }
  }

  async create({ owner, url, uploadId, position }: NewPhoto): Promise<Photo> {
    try {
      const row = await this.client.photo.create({
        data: {
          placeId: owner.type === "PLACE" ? owner.id : null,
          eventId: owner.type === "EVENT" ? owner.id : null,
          url,
          uploadId,
          position,
        },
      });
      return PrismaPhotoMapper.toDomain(row);
    } catch (error) {
      console.error("Error creating photo:", error);
      throw new DatabaseInsertError("Could not create photo", error);
    }
  }

  async nextPosition(owner: PhotoOwner): Promise<number> {
    try {
      const result = await this.client.photo.aggregate({
        _max: { position: true },
        where: PrismaPhotoMapper.ownerWhere(owner),
      });
      return result._max.position === null ? 0 : result._max.position + 1;
    } catch (error) {
      console.error("Error computing photo position:", error);
      throw new DatabaseError("Could not compute photo position", error);
    }
  }

  async setPositions(orderedIds: string[]): Promise<void> {
    try {
      for (const [position, id] of orderedIds.entries()) {
        await this.client.photo.update({ where: { id }, data: { position } });
      }
    } catch (error) {
      console.error("Error reordering photos:", error);
      throw new DatabaseInsertError("Could not reorder photos", error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { count } = await this.client.photo.deleteMany({ where: { id } });
      return count > 0;
    } catch (error) {
      console.error("Error deleting photo:", error);
      throw new DatabaseInsertError("Could not delete photo", error);
    }
  }

  async lockOwner(owner: PhotoOwner): Promise<boolean> {
    try {
      // Fully parameterized; the table name comes from a closed set, never from input.
      const rows = owner.type === "PLACE"
        ? await this.client.$queryRaw<{ id: string }[]>`SELECT id FROM Place WHERE id = ${owner.id} FOR UPDATE`
        : await this.client.$queryRaw<{ id: string }[]>`SELECT id FROM Event WHERE id = ${owner.id} FOR UPDATE`;
      return rows.length > 0;
    } catch (error) {
      console.error("Error locking photo owner:", error);
      throw new DatabaseError("Could not lock gallery", error);
    }
  }
}
