/** Body of `POST /places/:placeId/reviews` and `PUT /reviews/:id`. */
export interface ReviewRequest {
  rating: number;
  comment?: string | null;
}
