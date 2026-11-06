import { PhotoOwner } from "../valueObjects/photoOwner.valueObject";

/** Gallery item as embedded in the Place/Event detail read models. */
export interface GalleryPhoto {
  id: string;
  url: string;
  position: number;
}

/** One picture of a Place or Event gallery. Galleries are ordered by `position` ascending. */
export class Photo {
  constructor(private readonly props: PhotoProps) {}

  get id() { return this.props.id; }
  get owner() { return this.props.owner; }
  get url() { return this.props.url; }
  get position() { return this.props.position; }
  /** Set when the file lives in our object storage; null for external URLs. */
  get uploadId() { return this.props.uploadId; }
  get createdAt() { return this.props.createdAt; }
}

export interface PhotoProps {
  id: string;
  owner: PhotoOwner;
  url: string;
  position: number;
  uploadId: string | null;
  createdAt: Date;
}

/**
 * Whether `requested` is exactly the gallery's photo ids (same set, no duplicates, nothing
 * missing or extra), i.e. a valid new order for it.
 */
export function isPermutationOf(currentIds: string[], requested: string[]): boolean {
  if (requested.length !== currentIds.length) return false;
  const current = new Set(currentIds);
  const seen = new Set<string>();
  for (const id of requested) {
    if (!current.has(id) || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}
