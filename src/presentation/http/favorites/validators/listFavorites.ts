import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { FAVORITE_SORT_FIELDS } from "@/domain/favorites/repositories/IFavoriteRepository";

export { FAVORITE_SORT_FIELDS };

export const ListFavoritesQuerySchema = createPaginationQuerySchema(FAVORITE_SORT_FIELDS);
