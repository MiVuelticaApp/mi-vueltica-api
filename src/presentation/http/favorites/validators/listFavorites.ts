import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { FAVORITE_SORT_FIELDS } from "@/domain/favorites/repositories/IFavoriteRepository";
import { PLAN_TARGET_TYPES } from "@/domain/community/valueObjects/planTarget.valueObject";

export { FAVORITE_SORT_FIELDS };
export const FAVORITE_TYPES = PLAN_TARGET_TYPES;

export const ListFavoritesQuerySchema = createPaginationQuerySchema(FAVORITE_SORT_FIELDS).extend({
  // The app's "Guardados" tabs: Todo (omitted) / Lugares (PLACE) / Eventos (EVENT).
  type: z.enum(FAVORITE_TYPES, { error: "type debe ser PLACE o EVENT" }).optional(),
});
