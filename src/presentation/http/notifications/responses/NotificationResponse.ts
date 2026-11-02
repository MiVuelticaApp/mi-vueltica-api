/** Minimal event data shown in a notification. Datetimes are ISO 8601 UTC. */
export interface NotificationEventResponse {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  placeId: string | null;
}

export interface NotificationResponse {
  id: string;
  /** When the user was notified (ISO 8601 UTC). */
  sentAt: string;
  event: NotificationEventResponse;
}
