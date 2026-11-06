import { Photo } from "@/domain/photos/entities/Photo";
import { PhotoResponse } from "../responses/PhotoResponse";

export default class PhotoDtoMapper {
  static toResponse(photo: Photo): PhotoResponse {
    return {
      id: photo.id,
      placeId: photo.owner.type === "PLACE" ? photo.owner.id : null,
      eventId: photo.owner.type === "EVENT" ? photo.owner.id : null,
      url: photo.url,
      position: photo.position,
      createdAt: photo.createdAt.toISOString(),
    };
  }
}
