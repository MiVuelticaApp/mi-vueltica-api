import { NormalizedPlaceData, PlaceData, normalizePlaceData } from "@/domain/places/entities/Place";
import { EventData, NormalizedEventData, normalizeEventData } from "@/domain/events/entities/Event";
import DataException from "@/domain/core/errors/DataError";
import { PhotoUrl } from "@/domain/photos/valueObjects/photoUrl.valueObject";
import { parseSubmissionType } from "../valueObjects/submissionType.valueObject";

/** A suggestion can carry up to this many photos (URLs returned by `POST /uploads`). */
export const SUBMISSION_MAX_PHOTOS = 5;

/** Ordered photo URLs; on approval they become the Place/Event gallery in this order. */
interface SubmissionPhotos {
  photos?: string[];
}

// The submitter never chooses the source: approved submissions are attributed to the
// community source, so `sourceId` is not part of a submission's data.
export type SubmissionPlaceData = Omit<PlaceData, "sourceId"> & SubmissionPhotos;
export type SubmissionEventData = Omit<EventData, "sourceId"> & SubmissionPhotos;

/** What a client sends: the raw suggestion, typed by `type`. */
export type SubmissionPayloadInput =
  | { type: "PLACE"; data: SubmissionPlaceData }
  | { type: "EVENT"; data: SubmissionEventData };

/** The suggestion after running it through the Place/Event domain rules. `photos` is always set. */
export type SubmissionPayload =
  | { type: "PLACE"; data: Omit<NormalizedPlaceData, "sourceId"> & { photos: string[] } }
  | { type: "EVENT"; data: Omit<NormalizedEventData, "sourceId"> & { photos: string[] } };

/**
 * Shape-level rules for `data.photos`: optional (stored as `[]`), at most
 * `SUBMISSION_MAX_PHOTOS`, each an http(s) URL of at most 2048 chars, no duplicates.
 * Whether each URL is really one of the author's uploads is checked by the application layer.
 */
export function normalizeSubmissionPhotos(photos: unknown): string[] {
  if (photos === undefined || photos === null) return [];
  if (!Array.isArray(photos)) throw new DataException("photos debe ser una lista de URLs");
  if (photos.length > SUBMISSION_MAX_PHOTOS) {
    throw new DataException(`Se permiten como máximo ${SUBMISSION_MAX_PHOTOS} fotos`);
  }
  const urls = photos.map((photo) => PhotoUrl.create(photo, { requireHttps: false }).value);
  if (new Set(urls).size !== urls.length) throw new DataException("photos no puede contener URLs repetidas");
  return urls;
}

/**
 * Validates a suggestion with the same domain rules used to create a Place/Event
 * (`normalizePlaceData` / `normalizeEventData`), so an invalid suggestion can never be stored
 * or approved, whatever entry point it came from. Throws `DataException` (400).
 */
export function normalizeSubmissionPayload(input: SubmissionPayloadInput): SubmissionPayload {
  const type = parseSubmissionType(input?.type);
  const photos = normalizeSubmissionPhotos(input.data?.photos);
  if (type === "PLACE") {
    const { sourceId: _ignored, ...data } = normalizePlaceData({ ...(input.data as SubmissionPlaceData), sourceId: null });
    return { type, data: { ...data, photos } };
  }
  const { sourceId: _ignored, ...data } = normalizeEventData({ ...(input.data as SubmissionEventData), sourceId: null });
  return { type, data: { ...data, photos } };
}

/** Same payload with `data.photos` replaced (e.g. by their canonical URLs). */
export function withSubmissionPhotos(payload: SubmissionPayload, photos: string[]): SubmissionPayload {
  return payload.type === "PLACE"
    ? { type: "PLACE", data: { ...payload.data, photos } }
    : { type: "EVENT", data: { ...payload.data, photos } };
}
