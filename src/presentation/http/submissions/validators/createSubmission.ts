import z from "zod";
import { CreatePlaceSchema } from "@/presentation/http/places/validators/createPlace";
import {
  CreateEventBaseSchema,
  endsAtNotBeforeStartsAt,
  endsAtNotBeforeStartsAtError,
} from "@/presentation/http/events/validators/createEvent";

// A suggestion's `data` is exactly the Place/Event create body minus `sourceId`: the submitter
// never chooses the source (approved submissions are attributed to the community source).
// Unknown keys (including `sourceId`, `aiScore`, `aiReason`) are stripped, not rejected.
export const PlaceSubmissionDataSchema = CreatePlaceSchema.omit({ sourceId: true });

export const EventSubmissionDataSchema = CreateEventBaseSchema.omit({ sourceId: true })
  .refine(endsAtNotBeforeStartsAt, endsAtNotBeforeStartsAtError);

/** `type` decides which schema validates `data` (rendered as `oneOf` in the OpenAPI document). */
export const CreateSubmissionSchema = z.discriminatedUnion(
  "type",
  [
    z.object({ type: z.literal("PLACE"), data: PlaceSubmissionDataSchema }),
    z.object({ type: z.literal("EVENT"), data: EventSubmissionDataSchema }),
  ],
  { error: "type es requerido y debe ser PLACE o EVENT" },
);
