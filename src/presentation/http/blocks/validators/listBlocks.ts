import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { BLOCK_SORT_FIELDS } from "@/domain/blocks/repositories/IBlockRepository";

export { BLOCK_SORT_FIELDS };

export const ListBlocksQuerySchema = createPaginationQuerySchema(BLOCK_SORT_FIELDS);
