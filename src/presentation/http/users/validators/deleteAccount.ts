import z from "zod";

// Only the iOS client sends appleAuthCode (used to revoke the Apple token). Unknown keys are rejected.
export const DeleteAccountSchema = z.strictObject({
  appleAuthCode: z.string().optional(),
}, { error: "Solicitud no válida" });
