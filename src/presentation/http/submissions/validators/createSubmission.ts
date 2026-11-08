import z from "zod";
import { SUBMISSION_MAX_PHOTOS } from "@/domain/submissions/entities/SubmissionPayload";
import { PHOTO_URL_MAX_LENGTH } from "@/domain/photos/valueObjects/photoUrl.valueObject";
import { CreatePlaceSchema } from "@/presentation/http/places/validators/createPlace";
import {
  CreateEventBaseSchema,
  endsAtNotBeforeStartsAt,
  endsAtNotBeforeStartsAtError,
  eventLocationRule,
} from "@/presentation/http/events/validators/createEvent";

// A suggestion's `data` is exactly the Place/Event create body minus `sourceId`: the submitter
// never chooses the source (approved submissions are attributed to the community source).
// Unknown keys (including `sourceId`, `aiScore`, `aiReason`) are stripped, not rejected.
//
// `photos`: up to 5 URLs returned by `POST /uploads` (the author's own uploads, checked by the
// service → 422), in gallery order. On approval they become the Place/Event photos.
const SubmissionPhotosSchema = z
  .array(
    z.string({ error: "Cada foto debe ser una URL" }).trim().min(1, "Cada foto debe ser una URL")
      .max(PHOTO_URL_MAX_LENGTH, `Cada foto no puede exceder ${PHOTO_URL_MAX_LENGTH} caracteres`),
    { error: "photos debe ser una lista de URLs" },
  )
  .max(SUBMISSION_MAX_PHOTOS, `Se permiten como máximo ${SUBMISSION_MAX_PHOTOS} fotos`)
  .optional();

export const PlaceSubmissionDataSchema = CreatePlaceSchema.omit({ sourceId: true }).extend({ photos: SubmissionPhotosSchema });

export const EventSubmissionDataSchema = CreateEventBaseSchema.omit({ sourceId: true })
  .extend({ photos: SubmissionPhotosSchema })
  .refine(endsAtNotBeforeStartsAt, endsAtNotBeforeStartsAtError)
  .superRefine(eventLocationRule);

/** `type` decides which schema validates `data` (rendered as `oneOf` in the OpenAPI document). */
export const CreateSubmissionSchema = z.discriminatedUnion(
  "type",
  [
    z.object({ type: z.literal("PLACE"), data: PlaceSubmissionDataSchema }),
    z.object({ type: z.literal("EVENT"), data: EventSubmissionDataSchema }),
  ],
  { error: "type es requerido y debe ser PLACE o EVENT" },
);
