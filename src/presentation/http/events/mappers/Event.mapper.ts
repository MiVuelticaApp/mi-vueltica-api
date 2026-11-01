import { Event } from "@/domain/events/entities/Event";
import { EventDetail } from "@/domain/events/entities/EventDetail";
import { EventDetailResponse, EventResponse } from "../responses/EventResponse";

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
      status: event.status,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  static toDetailResponse(detail: EventDetail): EventDetailResponse {
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
    };
  }
}
