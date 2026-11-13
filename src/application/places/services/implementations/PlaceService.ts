import { Place, PlaceData, normalizePlaceData } from "@/domain/places/entities/Place";
import { PlaceDetail } from "@/domain/places/entities/PlaceDetail";
import { PlaceCard } from "@/domain/places/entities/PlaceCard";
import { IPlaceRepository, PlaceListFilters } from "@/domain/places/repositories/IPlaceRepository";
import { ICategoryRepository } from "@/domain/categories/repositories/ICategoryRepository";
import { ICantonRepository } from "@/domain/geography/repositories/ICantonRepository";
import { ISourceRepository } from "@/domain/sources/repositories/ISourceRepository";
import { ContentStatus, parseContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { IPlaceService, PlaceInput, PlaceVisibilityOptions } from "../interfaces/IPlaceService";
import { PlaceNotFoundError } from "../../errors/PlaceNotFoundError";
import { InvalidCantonError } from "../../errors/InvalidCantonError";
import { InvalidCategoryError } from "../../errors/InvalidCategoryError";
import { InvalidSourceError } from "../../errors/InvalidSourceError";

export class PlaceService implements IPlaceService {
  constructor(
    private readonly placeRepository: IPlaceRepository,
    private readonly cantonRepository: ICantonRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly sourceRepository: ISourceRepository,
  ) {}

  async list(params: PaginationParams, filters?: PlaceListFilters): Promise<PaginatedResult<PlaceCard>> {
    return this.placeRepository.list(params, filters);
  }

  async get(id: string, options: PlaceVisibilityOptions = {}): Promise<PlaceDetail> {
    const detail = await this.placeRepository.findDetail(id);
    if (!detail) throw new PlaceNotFoundError();
    const authorId = detail.place.authorId;
    if (authorId && options.excludeAuthorIds?.includes(authorId)) throw new PlaceNotFoundError();
    const isAuthor = options.viewerId !== undefined && detail.place.isAuthoredBy(options.viewerId);
    if (options.statuses && !options.statuses.includes(detail.place.status) && !isAuthor) {
      throw new PlaceNotFoundError();
    }
    return detail;
  }

  async create(data: PlaceInput): Promise<Place> {
    const normalized = normalizePlaceData(data);
    await this.ensureReferencesExist(normalized);
    return this.placeRepository.create(normalized);
  }

  async update(id: string, data: PlaceInput): Promise<Place> {
    const place = await this.findOrFail(id);
    // Validate the payload before touching the database for references.
    place.update(data);
    await this.ensureReferencesExist(normalizePlaceData(data));
    await this.placeRepository.update(place);
    return this.findOrFail(id);
  }

  async changeStatus(id: string, status: ContentStatus): Promise<Place> {
    const place = await this.findOrFail(id);
    place.changeStatus(parseContentStatus(status), new Date());
    await this.placeRepository.update(place);
    return this.findOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.findOrFail(id);
    // Photos, favorites and reviews cascade and events are detached (SET NULL) at DB level.
    await this.placeRepository.delete(id);
  }

  private async findOrFail(id: string): Promise<Place> {
    const place = await this.placeRepository.find(id);
    if (!place) throw new PlaceNotFoundError();
    return place;
  }

  private async ensureReferencesExist(data: Pick<PlaceData, "cantonId" | "categoryId" | "sourceId">): Promise<void> {
    if (!(await this.cantonRepository.find(data.cantonId))) throw new InvalidCantonError();
    if (!(await this.categoryRepository.find(data.categoryId))) throw new InvalidCategoryError();
    if (data.sourceId && !(await this.sourceRepository.find(data.sourceId))) throw new InvalidSourceError();
  }
}
