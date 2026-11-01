import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/core/validators/pagination";

export const CATEGORY_SORT_FIELDS = ["id", "name"] as const;

export const ListCategoriesQuerySchema = createPaginationQuerySchema(CATEGORY_SORT_FIELDS).extend({
  search: z.string().trim().max(100, { message: "La búsqueda no puede exceder 100 caracteres" }).optional(),
});
