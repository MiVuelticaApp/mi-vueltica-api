import { Review } from "./Review";

/** Read model for review responses: the review plus who wrote it and which place it is about. */
export interface ReviewDetail {
  review: Review;
  /** Only the author's first name is exposed. */
  author: { id: string; name: string };
  place: { id: string; name: string };
}
