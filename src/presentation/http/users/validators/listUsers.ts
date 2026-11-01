import { z } from "zod";
import { USER_ROLES } from "@/domain/users/entities/User";
import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";

export const USER_SORT_FIELDS = ["createdAt", "email", "name"] as const;

export const ListUsersQuerySchema = createPaginationQuerySchema(USER_SORT_FIELDS).extend({
  role: z.enum(USER_ROLES, { message: "Rol no válido" }).optional(),
  search: z.string().trim().min(1).max(100, { message: "La búsqueda no puede superar 100 caracteres" }).optional(),
});
