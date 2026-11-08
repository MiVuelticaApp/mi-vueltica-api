import { FavoriteItem, FavoriteTarget } from "@/domain/favorites/entities/FavoriteItem";
import { FavoriteListFilters, IFavoriteRepository } from "@/domain/favorites/repositories/IFavoriteRepository";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { IEventRepository } from "@/domain/events/repositories/IEventRepository";
import { withVisiblePlace } from "@/domain/events/entities/EventDetail";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { PlaceNotFoundError } from "@/application/places/errors/PlaceNotFoundError";
import { EventNotFoundError } from "@/application/events/errors/EventNotFoundError";
import { IFavoriteService } from "../interfaces/IFavoriteService";

/** The favorites list is a public view: only PUBLISHED content (and places) are shown. */
const VISIBLE_STATUSES: ContentStatus[] = ["PUBLISHED"];

export class FavoriteService implements IFavoriteService {
  constructor(
    private readonly favoriteRepository: IFavoriteRepository,
    private readonly placeRepository: IPlaceRepository,
    private readonly eventRepository: IEventRepository,
  ) {}

  async list(userId: string, params: PaginationParams, filters?: FavoriteListFilters): Promise<PaginatedResult<FavoriteItem>> {
    const result = await this.favoriteRepository.listForUser(userId, params, filters);
    return {
      ...result,
      items: result.items.map((item) =>
        item.type === "EVENT" ? { ...item, event: withVisiblePlace(item.event, VISIBLE_STATUSES) } : item,
      ),
    };
  }

  async add(userId: string, target: FavoriteTarget): Promise<void> {
    await this.ensurePublished(target);
    await this.favoriteRepository.add(userId, target);
  }

  async remove(userId: string, target: FavoriteTarget): Promise<void> {
    await this.favoriteRepository.remove(userId, target);
  }

  async isFavorite(userId: string, target: FavoriteTarget): Promise<boolean> {
    return this.favoriteRepository.exists(userId, target);
  }

  private async ensurePublished(target: FavoriteTarget): Promise<void> {
    if (target.type === "PLACE") {
      const place = await this.placeRepository.find(target.id);
      if (!place || place.status !== "PUBLISHED") throw new PlaceNotFoundError();
      return;
    }
    const event = await this.eventRepository.find(target.id);
    if (!event || event.status !== "PUBLISHED") throw new EventNotFoundError();
  }
}
