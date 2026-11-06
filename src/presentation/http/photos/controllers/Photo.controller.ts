import { Request, Response } from "express";
import { IPhotoService } from "@/application/photos/services/interfaces/IPhotoService";
import { PhotoOwner, PhotoOwnerType } from "@/domain/photos/valueObjects/photoOwner.valueObject";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { AddPhotoRequest } from "../requests/AddPhotoRequest";
import { ReorderPhotosRequest } from "../requests/ReorderPhotosRequest";
import PhotoDtoMapper from "../mappers/Photo.mapper";

type Handler = (req: Request, res: Response) => Promise<void>;

const PUBLIC_STATUSES: ContentStatus[] = ["PUBLISHED"];

/** Path param holding the owner id for each gallery. */
export const GALLERY_OWNER_PARAMS: Record<PhotoOwnerType, string> = { PLACE: "placeId", EVENT: "eventId" };

/** MODERATOR / ADMIN (set by `optionalJwtAuth` from the database) may see unpublished galleries. */
function canSeeUnpublished(req: Request): boolean {
  const role = req.user?.role;
  return role === "MODERATOR" || role === "ADMIN";
}

/**
 * Galleries of places (`/places/:placeId/photos`) and events (`/events/:eventId/photos`),
 * plus `DELETE /photos/:id`.
 */
export default class PhotoController {
  constructor(private readonly photoService: IPhotoService) {}

  /** The list / add / reorder handlers of one kind of gallery. */
  gallery(type: PhotoOwnerType): { list: Handler; add: Handler; reorder: Handler } {
    const ownerOf = (req: Request): PhotoOwner => ({
      type,
      id: getValidated<Record<string, string>>(req, "params")[GALLERY_OWNER_PARAMS[type]],
    });

    return {
      list: async (req, res) => {
        const photos = await this.photoService.list(ownerOf(req), {
          statuses: canSeeUnpublished(req) ? undefined : PUBLIC_STATUSES,
        });
        res.json(photos.map(PhotoDtoMapper.toResponse));
      },
      add: async (req, res) => {
        const { url }: AddPhotoRequest = req.body;
        const photo = await this.photoService.add(ownerOf(req), url);
        res.status(201).json(PhotoDtoMapper.toResponse(photo));
      },
      reorder: async (req, res) => {
        const { photoIds }: ReorderPhotosRequest = req.body;
        const photos = await this.photoService.reorder(ownerOf(req), photoIds);
        res.json(photos.map(PhotoDtoMapper.toResponse));
      },
    };
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<{ id: string }>(req, "params");
    await this.photoService.delete(id);
    res.status(204).send();
  }
}
