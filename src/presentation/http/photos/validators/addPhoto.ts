import z from "zod";
import { PHOTO_URL_MAX_LENGTH } from "@/domain/photos/valueObjects/photoUrl.valueObject";

/**
 * `url`: a URL returned by `POST /uploads` (linked to that upload) or any external https URL.
 * The https/upload rules live in the service so the domain enforces them for every caller.
 */
export const AddPhotoSchema = z.object({
  url: z
    .string({ error: "url es requerida" })
    .trim()
    .min(1, "url es requerida")
    .max(PHOTO_URL_MAX_LENGTH, `url no puede exceder ${PHOTO_URL_MAX_LENGTH} caracteres`),
});
