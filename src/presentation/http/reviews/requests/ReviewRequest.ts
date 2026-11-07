import { SpentTier, WentWith } from "@/domain/reviews/valueObjects/reviewExperience.valueObject";

/** Body of `POST /places/:placeId/reviews`, `POST /events/:eventId/reviews` and `PUT /reviews/:id`. */
export interface ReviewRequest {
  rating: number;
  comment?: string | null;
  wentWith?: WentWith | null;
  spent?: SpentTier | null;
  /** URLs returned by `POST /uploads` (the caller's own). */
  photos?: string[];
}
