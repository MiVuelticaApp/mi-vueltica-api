import { VerificationSummary } from "@/domain/community/entities/Verification";
import CommunityDtoMapper from "@/presentation/http/community/mappers/Community.mapper";
import { EventCard, EventDetail, EventListItem, PlaceSummary } from "@/domain/events/entities/EventDetail";
import { toPlanStatsResponse } from "@/presentation/http/core/mappers/PlanStats.mapper";
import { EventCardResponse, EventDetailResponse, EventResponse, PlaceSummaryResponse } from "../responses/EventResponse";
import RatingSummaryDtoMapper from "@/presentation/http/reviews/mappers/RatingSummary.mapper";

export default class EventDtoMapper {
  /** Lists, favorites and write responses. Expects the visibility rule already applied to `place`. */
  static toResponse({ event, place, location }: EventListItem): EventResponse {
    return {
      id: event.id,
      placeId: event.placeId,
      categoryId: event.categoryId,
      sourceId: event.sourceId,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt ? event.endsAt.toISOString() : null,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      address: location?.address ?? null,
      place: place ? EventDtoMapper.toPlaceSummaryResponse(place) : null,
      targetAudience: event.targetAudience,
      pricePerPerson: event.pricePerPerson,
      priceTier: event.priceTier,
      freeFor: [...event.freeFor],
      audiences: [...event.audiences],
      wheelchair: event.wheelchair,
      status: event.status,
      hiddenReason: event.hiddenReason,
      authorName: event.authorName,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  /** Lists and saved events: the event plus its card stats (rating and cover photo). */
  static toCardResponse(card: EventCard): EventCardResponse {
    return { ...EventDtoMapper.toResponse(card), ...toPlanStatsResponse(card.stats) };
  }

  static toDetailResponse(detail: EventDetail, verification: VerificationSummary): EventDetailResponse {
    return {
      ...EventDtoMapper.toResponse(detail),
      photos: detail.photos.map((photo) => ({ id: photo.id, url: photo.url, position: photo.position })),
      ...RatingSummaryDtoMapper.toDetailFields(detail.rating),
      ...CommunityDtoMapper.toVerificationFields(verification),
    };
  }

  private static toPlaceSummaryResponse(place: PlaceSummary): PlaceSummaryResponse {
    return {
      id: place.id,
      name: place.name,
      cantonId: place.cantonId,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      status: place.status,
    };
  }
}
