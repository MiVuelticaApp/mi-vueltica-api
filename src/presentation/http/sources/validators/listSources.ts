import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/core/validators/pagination";
import { SOURCE_TYPES } from "@/domain/sources/valueObjects/sourceType.valueObject";

export const SOURCE_SORT_FIELDS = ["name", "type", "lastCrawledAt"] as const;

export const ListSourcesQuerySchema = createPaginationQuerySchema(SOURCE_SORT_FIELDS).extend({
  type: z.enum(SOURCE_TYPES, { message: "Tipo de fuente no válido" }).optional(),
  search: z.string().trim().max(100, { message: "La búsqueda no puede exceder 100 caracteres" }).optional(),
});
