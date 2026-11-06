import { Photo, isPermutationOf } from "@/domain/photos/entities/Photo";
import { PhotoOwner } from "@/domain/photos/valueObjects/photoOwner.valueObject";
import { PhotoUrl } from "@/domain/photos/valueObjects/photoUrl.valueObject";
import { IPhotoRepository } from "@/domain/photos/repositories/IPhotoRepository";
import { IPhotoGalleryUnitOfWork } from "@/domain/photos/unitsOfWork/PhotoGalleryUnitOfWork";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { IEventRepository } from "@/domain/events/repositories/IEventRepository";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { IUploadService } from "@/application/uploads/services/interfaces/IUploadService";
import { PlaceNotFoundError } from "@/application/places/errors/PlaceNotFoundError";
import { EventNotFoundError } from "@/application/events/errors/EventNotFoundError";
import { IPhotoService, PhotoVisibilityOptions } from "../interfaces/IPhotoService";
import { PhotoNotFoundError } from "../../errors/PhotoNotFoundError";
import { InvalidPhotoOrderError } from "../../errors/InvalidPhotoOrderError";

const ownerNotFound = (owner: PhotoOwner) =>
  owner.type === "PLACE" ? new PlaceNotFoundError() : new EventNotFoundError();

export class PhotoService implements IPhotoService {
  constructor(
    private readonly photoRepository: IPhotoRepository,
    private readonly galleryUOW: IPhotoGalleryUnitOfWork,
    private readonly placeRepository: IPlaceRepository,
    private readonly eventRepository: IEventRepository,
    private readonly uploadService: IUploadService,
  ) {}

  async list(owner: PhotoOwner, options: PhotoVisibilityOptions = {}): Promise<Photo[]> {
    const status = await this.ownerStatus(owner);
    if (status === null || (options.statuses && !options.statuses.includes(status))) throw ownerNotFound(owner);
    return this.photoRepository.listByOwner(owner);
  }

  async add(owner: PhotoOwner, url: string): Promise<Photo> {
    // Our own file URL (any host/scheme, since PUBLIC_API_URL may be http in dev) is linked to
    // its upload and stored in canonical form; anything else must be an external https URL.
    const validated = PhotoUrl.create(url, { requireHttps: false }).value;
    const resolved = await this.uploadService.resolveUrl(validated);
    const photoUrl = resolved ? resolved.url : PhotoUrl.create(validated).value;

    return this.galleryUOW.runInTransaction(async (ctx) => {
      const photos = ctx.getPhotoRepository();
      if (!(await photos.lockOwner(owner))) throw ownerNotFound(owner);
      const position = await photos.nextPosition(owner);
      return photos.create({ owner, url: photoUrl, uploadId: resolved?.uploadId ?? null, position });
    });
  }

  async reorder(owner: PhotoOwner, photoIds: string[]): Promise<Photo[]> {
    return this.galleryUOW.runInTransaction(async (ctx) => {
      const photos = ctx.getPhotoRepository();
      if (!(await photos.lockOwner(owner))) throw ownerNotFound(owner);
      const current = await photos.listByOwner(owner);
      if (!isPermutationOf(current.map((photo) => photo.id), photoIds)) throw new InvalidPhotoOrderError();
      await photos.setPositions(photoIds);
      return photos.listByOwner(owner);
    });
  }

  async delete(id: string): Promise<void> {
    if (!(await this.photoRepository.delete(id))) throw new PhotoNotFoundError();
  }

  private async ownerStatus(owner: PhotoOwner): Promise<ContentStatus | null> {
    const entity = owner.type === "PLACE"
      ? await this.placeRepository.find(owner.id)
      : await this.eventRepository.find(owner.id);
    return entity ? entity.status : null;
  }
}
