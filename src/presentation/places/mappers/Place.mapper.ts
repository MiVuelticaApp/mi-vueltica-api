import { Place } from "@/domain/places/entities/Place";
import { PlaceDetail } from "@/domain/places/entities/PlaceDetail";
import { PlaceDetailResponse, PlaceResponse } from "../responses/PlaceResponse";

export default class PlaceDtoMapper {
  static toResponse(place: Place): PlaceResponse {
    return {
      id: place.id,
      cantonId: place.cantonId,
      categoryId: place.categoryId,
      sourceId: place.sourceId,
      name: place.name,
      description: place.description,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      openingHours: place.openingHours,
      targetAudience: place.targetAudience,
      status: place.status,
      verifiedAt: place.verifiedAt ? place.verifiedAt.toISOString() : null,
      createdAt: place.createdAt.toISOString(),
      updatedAt: place.updatedAt.toISOString(),
    };
  }

  static toDetailResponse(detail: PlaceDetail): PlaceDetailResponse {
    return {
      ...PlaceDtoMapper.toResponse(detail.place),
      photos: detail.photos.map((photo) => ({ id: photo.id, url: photo.url, position: photo.position })),
      averageRating: detail.rating.average === null ? null : Math.round(detail.rating.average * 100) / 100,
      reviewCount: detail.rating.count,
    };
  }
}
