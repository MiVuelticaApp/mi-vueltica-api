import { NormalizedPlaceData, PlaceData, normalizePlaceData } from "@/domain/places/entities/Place";
import { EventData, NormalizedEventData, normalizeEventData } from "@/domain/events/entities/Event";
import { parseSubmissionType } from "../valueObjects/submissionType.valueObject";

// The submitter never chooses the source: approved submissions are attributed to the
// community source, so `sourceId` is not part of a submission's data.
export type SubmissionPlaceData = Omit<PlaceData, "sourceId">;
export type SubmissionEventData = Omit<EventData, "sourceId">;

/** What a client sends: the raw suggestion, typed by `type`. */
export type SubmissionPayloadInput =
  | { type: "PLACE"; data: SubmissionPlaceData }
  | { type: "EVENT"; data: SubmissionEventData };

/** The suggestion after running it through the Place/Event domain rules. */
export type SubmissionPayload =
  | { type: "PLACE"; data: Omit<NormalizedPlaceData, "sourceId"> }
  | { type: "EVENT"; data: Omit<NormalizedEventData, "sourceId"> };

/**
 * Validates a suggestion with the same domain rules used to create a Place/Event
 * (`normalizePlaceData` / `normalizeEventData`), so an invalid suggestion can never be stored
 * or approved, whatever entry point it came from. Throws `DataException` (400).
 */
export function normalizeSubmissionPayload(input: SubmissionPayloadInput): SubmissionPayload {
  const type = parseSubmissionType(input?.type);
  if (type === "PLACE") {
    const { sourceId: _ignored, ...data } = normalizePlaceData({ ...(input.data as SubmissionPlaceData), sourceId: null });
    return { type, data };
  }
  const { sourceId: _ignored, ...data } = normalizeEventData({ ...(input.data as SubmissionEventData), sourceId: null });
  return { type, data };
}
