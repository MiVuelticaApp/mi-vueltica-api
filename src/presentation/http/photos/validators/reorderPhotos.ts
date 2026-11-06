import z from "zod";

export const REORDER_MAX_PHOTOS = 200;

/** Every photo id of the gallery, in the new order. */
export const ReorderPhotosSchema = z.object({
  photoIds: z
    .array(z.uuid({ error: "photoIds debe contener UUIDs válidos" }), { error: "photoIds debe ser una lista" })
    .max(REORDER_MAX_PHOTOS, `photoIds no puede tener más de ${REORDER_MAX_PHOTOS} elementos`),
});
