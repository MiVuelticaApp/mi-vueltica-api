import { z } from "zod";

export const AppleLoginSchema = z.object({
  identityToken: z.string().min(1, { message: "El identity token de Apple no puede estar vacío" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});
