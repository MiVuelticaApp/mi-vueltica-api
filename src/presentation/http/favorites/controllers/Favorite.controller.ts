import { Request, Response } from "express";
import { z } from "zod";
import { IFavoriteService } from "@/application/favorites/services/interfaces/IFavoriteService";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListFavoritesQuerySchema } from "../validators/listFavorites";
import FavoriteDtoMapper from "../mappers/Favorite.mapper";

type ListQuery = z.output<typeof ListFavoritesQuerySchema>;
type PlaceParams = { placeId: string };

export default class FavoriteController {
  constructor(private readonly favoriteService: IFavoriteService) {}

  async list(req: Request, res: Response): Promise<void> {
    const { id } = getAuthUser(req);
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.favoriteService.list(id, toPaginationParams(query));
    res.json(toPaginatedResponse(result, FavoriteDtoMapper.toResponse));
  }

  async add(req: Request, res: Response): Promise<void> {
    const { id } = getAuthUser(req);
    const { placeId } = getValidated<PlaceParams>(req, "params");
    await this.favoriteService.add(id, placeId);
    res.status(204).send();
  }

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = getAuthUser(req);
    const { placeId } = getValidated<PlaceParams>(req, "params");
    await this.favoriteService.remove(id, placeId);
    res.status(204).send();
  }
}
