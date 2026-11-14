/** The three switches of Ajustes › Notificaciones (#10). Reminders are local in the app; the API only stores them. */
export interface NotificationSettings {
  reminders: boolean;
  newNearby: boolean;
  myStatus: boolean;
}

/** A user due for the weekly "Planes nuevos cerca" push. */
export interface NearbyCandidate {
  userId: string;
  provinceId: number;
  provinceName: string;
}

export interface INotificationSettingsRepository {
  get(userId: string): Promise<NotificationSettings | null>;
  update(userId: string, settings: NotificationSettings): Promise<void>;
  /** Users with "nuevos cerca" on, a province, a device, and no such push since `notSince`. */
  nearbyCandidates(notSince: Date, limit: number): Promise<NearbyCandidate[]>;
  /** Published places and upcoming events in the province created since `since`. */
  countNewInProvince(provinceId: number, since: Date): Promise<number>;
  markNearbySent(userId: string, at: Date): Promise<void>;
}
