import { PlanStats } from "@/domain/core/plans/PlanStats";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";

/**
 * Prisma `include` for a list card's thumbnail: only the first gallery photo (lowest `position`, then `id`,
 * the same order as the detail gallery), and only its URL.
 */
export const COVER_PHOTO_INCLUDE = {
  photos: { orderBy: [{ position: "asc" }, { id: "asc" }], take: 1, select: { url: true } },
} satisfies { photos: Prisma.Place$photosArgs };

/** A Place/Event row loaded with `COVER_PHOTO_INCLUDE`. */
export interface CoverPhotoRow {
  photos?: { url: string }[];
}

interface Rating {
  average: number | null;
  count: number;
}

/**
 * PUBLISHED rating (mean and count) of every place or event in `ids`, in ONE grouped query per page (no query
 * per item). Ids without reviews are absent from the map.
 */
export async function publishedRatingsFor(
  client: Prisma.TransactionClient,
  kind: "place" | "event",
  ids: string[],
): Promise<Map<string, Rating>> {
  const out = new Map<string, Rating>();
  if (ids.length === 0) return out;
  if (kind === "place") {
    const groups = await client.review.groupBy({
      by: ["placeId"],
      where: { placeId: { in: ids }, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    for (const g of groups) if (g.placeId) out.set(g.placeId, { average: g._avg.rating, count: g._count._all });
  } else {
    const groups = await client.review.groupBy({
      by: ["eventId"],
      where: { eventId: { in: ids }, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    for (const g of groups) if (g.eventId) out.set(g.eventId, { average: g._avg.rating, count: g._count._all });
  }
  return out;
}

/** The card stats of one row from its loaded cover photo and its entry in `publishedRatingsFor`. */
export function toPlanStats(row: CoverPhotoRow, rating: Rating | undefined): PlanStats {
  return {
    averageRating: rating?.average ?? null,
    reviewCount: rating?.count ?? 0,
    coverPhotoUrl: row.photos?.[0]?.url ?? null,
  };
}
