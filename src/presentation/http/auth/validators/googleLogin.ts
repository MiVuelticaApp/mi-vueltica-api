import { z } from "zod";

export const GoogleLoginSchema = z.object({
  token: z.string({
    message: "Token de Google es requerido",
  }).min(1, {
    message: "Token de Google no puede estar vacío",
  }),
  // The privacy notice version the person accepted (#7); required to create a new account.
  privacyVersion: z.string().trim().min(1).max(32).optional(),
});
