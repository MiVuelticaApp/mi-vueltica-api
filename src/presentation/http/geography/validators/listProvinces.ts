import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";

export const PROVINCE_SORT_FIELDS = ["id", "name"] as const;
export const PROVINCE_INCLUDES = ["cantons"] as const;

export const ListProvincesQuerySchema = createPaginationQuerySchema(PROVINCE_SORT_FIELDS).extend({
  include: z
    .enum(PROVINCE_INCLUDES, { error: `include solo admite: ${PROVINCE_INCLUDES.join(", ")}` })
    .optional(),
});
