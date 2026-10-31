import z from "zod";

const KNOWN_KEYS = ["appleAuthCode"];

export const DeleteAccountSchema = z.object({
  appleAuthorizationCode: z.string().optional(),
}).passthrough().superRefine((val, ctx) => {
  for (const key of Object.keys(val)) {
    if (!KNOWN_KEYS.includes(key)) {
      ctx.addIssue({
        code: "custom",
        message: "Solicitud no válida",
        path: [key],
      });
    }
  }
});