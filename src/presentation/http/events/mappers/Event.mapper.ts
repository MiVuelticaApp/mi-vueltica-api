import { VerificationSummary } from "@/domain/community/entities/Verification";
import CommunityDtoMapper from "@/presentation/http/community/mappers/Community.mapper";
import { Event } from "@/domain/events/entities/Event";
import { EventDetail } from "@/domain/events/entities/EventDetail";
import { EventDetailResponse, EventResponse } from "../responses/EventResponse";
import RatingSummaryDtoMapper from "@/presentation/http/reviews/mappers/RatingSummary.mapper";

export default class EventDtoMapper {
  static toResponse(event: Event): EventResponse {
    return {
      id: event.id,
      placeId: event.placeId,
      categoryId: event.categoryId,
      sourceId: event.sourceId,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt ? event.endsAt.toISOString() : null,
      targetAudience: event.targetAudience,
      pricePerPerson: event.pricePerPerson,
      priceTier: event.priceTier,
      freeFor: [...event.freeFor],
      audiences: [...event.audiences],
      wheelchair: event.wheelchair,
      status: event.status,
      hiddenReason: event.hiddenReason,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  static toDetailResponse(detail: EventDetail, verification: VerificationSummary): EventDetailResponse {
    return {
      ...EventDtoMapper.toResponse(detail.event),
      place: detail.place
        ? {
            id: detail.place.id,
            name: detail.place.name,
            cantonId: detail.place.cantonId,
            latitude: detail.place.latitude,
            longitude: detail.place.longitude,
            address: detail.place.address,
            status: detail.place.status,
          }
        : null,
      photos: detail.photos.map((photo) => ({ id: photo.id, url: photo.url, position: photo.position })),
      ...RatingSummaryDtoMapper.toDetailFields(detail.rating),
      ...CommunityDtoMapper.toVerificationFields(verification),
    };
  }
}
