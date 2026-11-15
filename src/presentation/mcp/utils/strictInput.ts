import { z } from "zod";

/**
 * Tool input as a strict object: an argument that is not in the shape (e.g. `status` sent to `create_event`)
 * is rejected by the SDK with an "Unrecognized key" error instead of being silently dropped. A plain raw
 * shape would strip unknown keys. Always register tools with `strictInput(shape)`.
 */
export function strictInput<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}
