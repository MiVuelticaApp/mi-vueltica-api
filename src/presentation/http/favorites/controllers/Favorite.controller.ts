import { Request, Response } from "express";
import { z } from "zod";
import { IFavoriteService } from "@/application/favorites/services/interfaces/IFavoriteService";
import { FavoriteTarget, FavoriteType } from "@/domain/favorites/entities/FavoriteItem";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListFavoritesQuerySchema } from "../validators/listFavorites";
import FavoriteDtoMapper from "../mappers/Favorite.mapper";

type ListQuery = z.output<typeof ListFavoritesQuerySchema>;
type Handler = (req: Request, res: Response) => Promise<void>;

/** Path param that carries the target id in each favorite router. */
export const FAVORITE_TARGET_PARAMS: Record<FavoriteType, string> = { PLACE: "placeId", EVENT: "eventId" };

export default class FavoriteController {
  constructor(private readonly favoriteService: IFavoriteService) {}

  async list(req: Request, res: Response): Promise<void> {
    const { id } = getAuthUser(req);
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.favoriteService.list(id, toPaginationParams(query), { type: query.type });
    res.json(toPaginatedResponse(result, FavoriteDtoMapper.toResponse));
  }

  /** `PUT` / `DELETE` handlers for `/places/:placeId/favorite` or `/events/:eventId/favorite`. Both answer 204. */
  target(type: FavoriteType): { add: Handler; remove: Handler } {
    const targetOf = (req: Request): FavoriteTarget => ({
      type,
      id: getValidated<Record<string, string>>(req, "params")[FAVORITE_TARGET_PARAMS[type]],
    });

    return {
      add: async (req: Request, res: Response) => {
        await this.favoriteService.add(getAuthUser(req).id, targetOf(req));
        res.status(204).send();
      },
      remove: async (req: Request, res: Response) => {
        await this.favoriteService.remove(getAuthUser(req).id, targetOf(req));
        res.status(204).send();
      },
    };
  }
}
