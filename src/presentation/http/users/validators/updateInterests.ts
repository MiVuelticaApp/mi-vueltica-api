import { z } from "zod";

export const MAX_INTERESTS = 20;

export const UpdateInterestsSchema = z.strictObject({
  categoryIds: z
    .array(
      z.int({ error: "Cada categoría debe ser un número entero" }).positive({ message: "Cada categoría debe ser un id válido" }),
      { error: "categoryIds debe ser una lista de ids" },
    )
    .max(MAX_INTERESTS, { message: `No puedes seleccionar más de ${MAX_INTERESTS} intereses` })
    .refine((ids) => new Set(ids).size === ids.length, { message: "Las categorías no pueden repetirse" }),
});
