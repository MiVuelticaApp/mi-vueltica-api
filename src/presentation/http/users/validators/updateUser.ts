import z from "zod";
import { AGE_RANGES } from "@/domain/users/entities/User";

export const UpdateUserSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  surnames: z.string().min(1, { message: "Los apellidos son requeridos" }),
  ageRange: z.enum(AGE_RANGES, { message: "Rango de edad no válido" }).nullable().optional(),
});
