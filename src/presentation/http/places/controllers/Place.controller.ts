import { Request, Response } from "express";
import { z } from "zod";
import { IFavoriteService } from "@/application/favorites/services/interfaces/IFavoriteService";
import { IPlaceService } from "@/application/places/services/interfaces/IPlaceService";
import { PlaceListFilters } from "@/domain/places/repositories/IPlaceRepository";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListPlacesQuerySchema } from "../validators/listPlaces";
import { CreatePlaceRequest } from "../requests/CreatePlaceRequest";
import { UpdatePlaceRequest } from "../requests/UpdatePlaceRequest";
import { ChangePlaceStatusRequest } from "../requests/ChangePlaceStatusRequest";
import PlaceDtoMapper from "../mappers/Place.mapper";
import { ICommunityService } from "@/application/community/services/interfaces/ICommunityService";
import { optionalPerson } from "@/presentation/http/community/utils/person";

type ListQuery = z.output<typeof ListPlacesQuerySchema>;
type IdParams = { id: string };

const PUBLIC_STATUSES: ContentStatus[] = ["PUBLISHED"];

/** MODERATOR / ADMIN (set by `optionalJwtAuth` from the database) may see unpublished places. */
function canSeeUnpublished(req: Request): boolean {
  const role = req.user?.role;
  return role === "MODERATOR" || role === "ADMIN";
}

export default class PlaceController {
  constructor(
    private readonly placeService: IPlaceService,
    private readonly favoriteService: IFavoriteService,
    private readonly communityService: ICommunityService,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = getValidated<ListQuery>(req, "query");
    const privileged = canSeeUnpublished(req);

    const filters: PlaceListFilters = {
      cantonId: query.cantonId,
      provinceId: query.provinceId,
      categoryId: query.categoryId,
      targetAudience: query.targetAudience,
      // Anonymous/regular users only ever see PUBLISHED and the `status` param is ignored.
      statuses: privileged ? (query.status ? [query.status] : undefined) : PUBLIC_STATUSES,
      search: query.q || undefined,
      maxPrice: query.maxPrice,
      students: query.students,
      seniors: query.seniors,
      families: query.families,
      wheelchair: query.wheelchair,
    };

    if (query.minLat !== undefined) {
      filters.bbox = { minLat: query.minLat, minLng: query.minLng!, maxLat: query.maxLat!, maxLng: query.maxLng! };
    } else if (query.lat !== undefined) {
      filters.radius = { lat: query.lat, lng: query.lng!, radiusKm: query.radiusKm! };
    }

    const result = await this.placeService.list(toPaginationParams(query), filters);
    res.json(toPaginatedResponse(result, PlaceDtoMapper.toResponse));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const detail = await this.placeService.get(id, {
      statuses: canSeeUnpublished(req) ? undefined : PUBLIC_STATUSES,
      viewerId: req.user?.id,
    });
    const verification = await this.communityService.verificationSummary({ type: "PLACE", id }, optionalPerson(req));
    const response = PlaceDtoMapper.toDetailResponse(detail, verification);
    // `isFavorite` and `isMine` are only present for authenticated callers.
    if (req.user) {
      response.isFavorite = await this.favoriteService.isFavorite(req.user.id, id);
      response.isMine = detail.place.isAuthoredBy(req.user.id);
    }
    res.json(response);
  }

  async create(req: Request, res: Response): Promise<void> {
    const body: CreatePlaceRequest = req.body;
    const place = await this.placeService.create(body);
    res.status(201).json(PlaceDtoMapper.toResponse(place));
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const body: UpdatePlaceRequest = req.body;
    const place = await this.placeService.update(id, body);
    res.json(PlaceDtoMapper.toResponse(place));
  }

  async changeStatus(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const { status }: ChangePlaceStatusRequest = req.body;
    const place = await this.placeService.changeStatus(id, status);
    res.json(PlaceDtoMapper.toResponse(place));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    await this.placeService.delete(id);
    res.status(204).send();
  }
}
