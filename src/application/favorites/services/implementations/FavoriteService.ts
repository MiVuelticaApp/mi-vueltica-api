import { FavoritePlace } from "@/domain/favorites/entities/FavoritePlace";
import { IFavoriteRepository } from "@/domain/favorites/repositories/IFavoriteRepository";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { PlaceNotFoundError } from "@/application/places/errors/PlaceNotFoundError";
import { IFavoriteService } from "../interfaces/IFavoriteService";

export class FavoriteService implements IFavoriteService {
  constructor(
    private readonly favoriteRepository: IFavoriteRepository,
    private readonly placeRepository: IPlaceRepository,
  ) {}

  async list(userId: string, params: PaginationParams): Promise<PaginatedResult<FavoritePlace>> {
    return this.favoriteRepository.listForUser(userId, params);
  }

  async add(userId: string, placeId: string): Promise<void> {
    const place = await this.placeRepository.find(placeId);
    if (!place || place.status !== "PUBLISHED") throw new PlaceNotFoundError();
    await this.favoriteRepository.add(userId, placeId);
  }

  async remove(userId: string, placeId: string): Promise<void> {
    await this.favoriteRepository.remove(userId, placeId);
  }

  async isFavorite(userId: string, placeId: string): Promise<boolean> {
    return this.favoriteRepository.exists(userId, placeId);
  }
}
