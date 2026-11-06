export interface PhotoResponse {
  id: string;
  /** Exactly one of `placeId` / `eventId` is set. */
  placeId: string | null;
  eventId: string | null;
  url: string;
  position: number;
  createdAt: string;
}
