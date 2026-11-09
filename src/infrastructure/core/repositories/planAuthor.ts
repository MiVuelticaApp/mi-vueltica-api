import { planAuthorName } from "@/domain/community/valueObjects/planAuthor.valueObject";

/**
 * Prisma `include` that loads what `authorName` needs (#40): only the author's names, never the
 * email or the SSO subject. Add it to every Place/Event read whose result reaches a response.
 */
export const PLAN_AUTHOR_INCLUDE = { author: { select: { name: true, surnames: true } } } as const;

/** A Place/Event row, optionally with the author loaded through `PLAN_AUTHOR_INCLUDE`. */
export interface PlanAuthorRow {
  authorId: string | null;
  sourceId: string | null;
  author?: { name: string; surnames: string } | null;
}

export const authorNameFromRow = (row: PlanAuthorRow): string | null =>
  planAuthorName({ authorId: row.authorId, author: row.author, sourceId: row.sourceId });
