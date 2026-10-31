import z from "zod";

export const UpdateUserSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  surnames: z.string().min(1, { message: "Los apellidos son requeridos" }),
  birthdate: z.string().min(1, { message: "La fecha de nacimiento es requerida" }),
  gender: z.enum(["male", "female", "other"]),
});