/** A photo belongs to exactly one Place or one Event (DB CHECK `Photo_owner_check`). */
export const PHOTO_OWNER_TYPES = ["PLACE", "EVENT"] as const;
export type PhotoOwnerType = (typeof PHOTO_OWNER_TYPES)[number];

export interface PhotoOwner {
  type: PhotoOwnerType;
  id: string;
}
