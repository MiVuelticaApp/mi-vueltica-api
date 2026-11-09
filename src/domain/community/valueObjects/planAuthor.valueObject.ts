import { COMMUNITY_SOURCE_ID } from "@/domain/sources/communitySource";

/** Shown when a community plan has no known author (deleted account, or approved before #39). */
export const ANONYMOUS_AUTHOR_NAME = "Anónimo";

/** The author's names as stored on `User`. */
export interface PlanAuthorNames {
  name: string;
  surnames: string;
}

/**
 * Public display name of a plan's author, as in the app's "Vueltica de Ana M.": first name plus the
 * initial of the first surname. Same privacy level as reviews (first name and initials only).
 */
export function authorDisplayName({ name, surnames }: PlanAuthorNames): string {
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const surnameInitial = surnames.trim().charAt(0).toUpperCase();
  if (!firstName) return ANONYMOUS_AUTHOR_NAME;
  return surnameInitial ? `${firstName} ${surnameInitial}.` : firstName;
}

/**
 * `authorName` of a Place/Event (#40):
 * - with an author → `authorDisplayName`;
 * - no author and the community source → "Anónimo" (the submitter deleted their account, or it was
 *   approved before authors were recorded);
 * - no author and any other source → `null` (team or crawler content, nobody to credit).
 * `author` must be loaded whenever `authorId` is set; if it is missing, `null` is returned.
 */
export function planAuthorName(input: {
  authorId: string | null;
  author: PlanAuthorNames | null | undefined;
  sourceId: string | null;
}): string | null {
  if (input.authorId) return input.author ? authorDisplayName(input.author) : null;
  return input.sourceId === COMMUNITY_SOURCE_ID ? ANONYMOUS_AUTHOR_NAME : null;
}
