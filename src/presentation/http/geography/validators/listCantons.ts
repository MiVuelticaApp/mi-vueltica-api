import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { CANTON_SORT_FIELDS } from "@/domain/geography/repositories/ICantonRepository";

export { CANTON_SORT_FIELDS };

/** GET /provinces/:provinceId/cantons — default order is `id` ascending. */
export const ListCantonsQuerySchema = createPaginationQuerySchema(CANTON_SORT_FIELDS);
