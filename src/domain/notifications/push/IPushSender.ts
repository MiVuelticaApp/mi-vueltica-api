/** A push for every device of one user. `data` is read by the app to open a screen when it is tapped. */
export interface PushMessage {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/** Sends pushes (Expo push service). Best effort: never throws; forgets devices whose token is no longer valid. */
export interface IPushSender {
  send(messages: PushMessage[]): Promise<void>;
}
