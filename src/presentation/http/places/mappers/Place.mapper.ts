import { VerificationSummary } from "@/domain/community/entities/Verification";
import CommunityDtoMapper from "@/presentation/http/community/mappers/Community.mapper";
import { Place } from "@/domain/places/entities/Place";
import { PlaceDetail } from "@/domain/places/entities/PlaceDetail";
import { PlaceCardResponse, PlaceDetailResponse, PlaceResponse } from "../responses/PlaceResponse";
import { PlaceCard } from "@/domain/places/entities/PlaceCard";
import { toPlanStatsResponse } from "@/presentation/http/core/mappers/PlanStats.mapper";
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
      hiddenReason: place.hiddenReason,
      authorName: place.authorName,
      verifiedAt: place.verifiedAt ? place.verifiedAt.toISOString() : null,
      createdAt: place.createdAt.toISOString(),
      updatedAt: place.updatedAt.toISOString(),
    };
  }

  /** Lists and saved places: the place plus its card stats (rating and cover photo). */
  static toCardResponse({ place, stats }: PlaceCard): PlaceCardResponse {
    return { ...PlaceDtoMapper.toResponse(place), ...toPlanStatsResponse(stats) };
  }

  static toDetailResponse(detail: PlaceDetail, verification: VerificationSummary): PlaceDetailResponse {
    return {
      ...PlaceDtoMapper.toResponse(detail.place),
      photos: detail.photos.map((photo) => ({ id: photo.id, url: photo.url, position: photo.position })),
      ...RatingSummaryDtoMapper.toDetailFields(detail.rating),
      ...CommunityDtoMapper.toVerificationFields(verification),
    };
  }
}
