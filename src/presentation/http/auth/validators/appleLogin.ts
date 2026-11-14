import { z } from "zod";

export const AppleLoginSchema = z.object({
  identityToken: z.string().min(1, { message: "El identity token de Apple no puede estar vacío" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  // The privacy notice version the person accepted (#7); required to create a new account.
  privacyVersion: z.string().trim().min(1).max(32).optional(),
});
