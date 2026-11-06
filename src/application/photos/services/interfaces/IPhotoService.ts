import { Photo } from "@/domain/photos/entities/Photo";
import { PhotoOwner } from "@/domain/photos/valueObjects/photoOwner.valueObject";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

export interface PhotoVisibilityOptions {
  /** The gallery is only visible if its Place/Event is in one of these statuses. `undefined` = any. */
  statuses?: ContentStatus[];
}

export interface IPhotoService {
  /** Ordered gallery. 404 (`PlaceNotFoundError` / `EventNotFoundError`) if the owner is missing or hidden. */
  list(owner: PhotoOwner, options?: PhotoVisibilityOptions): Promise<Photo[]>;
  /**
   * Appends a photo (`position = max + 1`). `url` is either one of our file URLs (linked to its
   * upload) or an external https URL.
   */
  add(owner: PhotoOwner, url: string): Promise<Photo>;
  /** `photoIds` must be exactly the gallery's ids; applied in one transaction. Returns the new order. */
  reorder(owner: PhotoOwner, photoIds: string[]): Promise<Photo[]>;
  /** Throws `PhotoNotFoundError`. The upload (if any) is left to the orphan cleanup. */
  delete(id: string): Promise<void>;
}
