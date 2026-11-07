import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

export interface ReviewResponse {
  id: string;
  placeId: string;
  rating: number;
  comment: string | null;
  status: ContentStatus;
  createdAt: string;
  /** Only the author's first name is exposed. */
  author: { id: string; name: string };
  place: { id: string; name: string };
}
