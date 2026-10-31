import { z } from "zod";

export const GoogleLoginSchema = z.object({
  token: z.string({
    message: "Token de Google es requerido",
  }).min(1, {
    message: "Token de Google no puede estar vacío",
  }),
});
