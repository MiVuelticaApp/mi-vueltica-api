/** A photo belongs to exactly one Place or one Event (enforced by the application, not the DB). */
export const PHOTO_OWNER_TYPES = ["PLACE", "EVENT"] as const;
export type PhotoOwnerType = (typeof PHOTO_OWNER_TYPES)[number];

export interface PhotoOwner {
  type: PhotoOwnerType;
  id: string;
}
