import { z } from "zod";
import { USER_ROLES } from "@/domain/users/entities/User";

export const ChangeUserRoleSchema = z.object({
  role: z.enum(USER_ROLES, { message: "Rol no válido" }),
});
