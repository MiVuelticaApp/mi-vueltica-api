import z from "zod";
import { PLATFORMS } from "@/domain/devices/valueObjects/platform.valueObject";
import { PUSH_TOKEN_MAX_LENGTH } from "@/domain/devices/valueObjects/pushToken.valueObject";

/** Shared with the logout body, which can carry the current device's token. */
export const pushTokenField = z
  .string({ error: "El token push es requerido" })
  .trim()
  .min(1, { message: "El token push es requerido" })
  .max(PUSH_TOKEN_MAX_LENGTH, { message: `El token push no puede exceder ${PUSH_TOKEN_MAX_LENGTH} caracteres` });

export const RegisterDeviceSchema = z.object({
  platform: z.enum(PLATFORMS, { error: `platform debe ser uno de: ${PLATFORMS.join(", ")}` }),
  pushToken: pushTokenField,
});
