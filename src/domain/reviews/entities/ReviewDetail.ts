import { Review } from "./Review";

export interface ReviewAuthor {
  id: string;
  /** Only the author's first name is exposed. */
  name: string;
  /** Up to two letters: first name + first surname. */
  initials: string;
}

/** Read model for review responses. */
export interface ReviewDetail {
  review: Review;
  /** Null once the author deleted their account (the review is kept, shown as "Anónimo"). */
  author: ReviewAuthor | null;
  /** Set for place reviews. */
  place: { id: string; name: string } | null;
  /** Set for event reviews. */
  event: { id: string; title: string } | null;
  /** Photo URLs in the order the author attached them. */
  photos: string[];
  usefulCount: number;
  /** Whether the caller marked it as useful (false for anonymous callers). */
  markedUsefulByMe: boolean;
}

/** Initials as the app computes them (`initialsOf`): first letter of the first two words. */
export function initialsOf(...parts: string[]): string {
  const words = parts.join(" ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}
