import { Place } from "@/domain/places/entities/Place";
import { PlaceDetail } from "@/domain/places/entities/PlaceDetail";
import { PlaceDetailResponse, PlaceResponse } from "../responses/PlaceResponse";
import RatingSummaryDtoMapper from "@/presentation/http/reviews/mappers/RatingSummary.mapper";

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
      pricePerPerson: place.pricePerPerson,
      priceTier: place.priceTier,
      freeFor: [...place.freeFor],
      audiences: [...place.audiences],
      wheelchair: place.wheelchair,
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
      ...RatingSummaryDtoMapper.toDetailFields(detail.rating),
    };
  }
}
