import DataException from "@/domain/core/errors/DataError";
import { Coordinates } from "@/domain/places/valueObjects/coordinates.valueObject";
import { PlaceAddress } from "@/domain/places/valueObjects/placeAddress.valueObject";

/** Where an event happens: a point on the map plus an optional address. */
export interface EventLocationValue {
  latitude: number;
  longitude: number;
  address: string | null;
}

/** The location fields of an event body. `null` and `undefined` both mean "not sent". */
export interface EventLocationInput {
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

export const EVENT_LOCATION_WITH_PLACE_ERROR =
  "Un evento con lugar usa la ubicación del lugar: no envíes latitude, longitude ni address junto con placeId";
export const EVENT_COORDINATES_TOGETHER_ERROR = "latitude y longitude deben enviarse juntas";
export const EVENT_ADDRESS_WITHOUT_COORDINATES_ERROR = "La dirección del evento requiere latitude y longitude";

const isSent = (value: unknown) => value !== null && value !== undefined;
const isSentAddress = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : isSent(value);

/**
 * Rules shared by the Zod validators and the domain: returns the message of the first broken rule, or
 * `null`. An event either takes its location from its place (`placeId`) or carries its own point;
 * having neither is allowed (it is just not shown on the map).
 */
export function eventLocationError(input: EventLocationInput): string | null {
  const hasLat = isSent(input.latitude);
  const hasLng = isSent(input.longitude);
  const hasAddress = isSentAddress(input.address);
  if (input.placeId && (hasLat || hasLng || hasAddress)) return EVENT_LOCATION_WITH_PLACE_ERROR;
  if (hasLat !== hasLng) return EVENT_COORDINATES_TOGETHER_ERROR;
  if (hasAddress && !hasLat) return EVENT_ADDRESS_WITHOUT_COORDINATES_ERROR;
  return null;
}

/**
 * The event's **own** location (used only when it has no place). Throws `DataException` when the
 * fields break `eventLocationError` or are out of range; returns `null` when none were sent.
 */
export function normalizeEventLocation(input: EventLocationInput): EventLocationValue | null {
  const error = eventLocationError(input);
  if (error) throw new DataException(error);
  if (!isSent(input.latitude)) return null;
  const coordinates = Coordinates.create(input.latitude as number, input.longitude as number);
  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    address: PlaceAddress.create(input.address).value,
  };
}
