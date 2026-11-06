import { Photo } from "@/domain/photos/entities/Photo";
import { PhotoOwner } from "@/domain/photos/valueObjects/photoOwner.valueObject";

export interface NewPhoto {
  owner: PhotoOwner;
  url: string;
  uploadId: string | null;
  position: number;
}

export interface IPhotoRepository {
  /** Ordered by `position`, then `id`. */
  listByOwner(owner: PhotoOwner): Promise<Photo[]>;
  find(id: string): Promise<Photo | null>;
  create(data: NewPhoto): Promise<Photo>;
  /** `max(position) + 1`, or 0 for an empty gallery. */
  nextPosition(owner: PhotoOwner): Promise<number>;
  /** Sets `position = index` for each id. Run inside a unit of work. */
  setPositions(orderedIds: string[]): Promise<void>;
  /** Returns whether a photo was deleted. */
  delete(id: string): Promise<boolean>;
  /**
   * Locks the owner's row (`SELECT ... FOR UPDATE`) until the transaction ends, so gallery
   * writes of the same Place/Event run one after another. Returns false if it does not exist.
   * Only meaningful inside a unit of work.
   */
  lockOwner(owner: PhotoOwner): Promise<boolean>;
}
