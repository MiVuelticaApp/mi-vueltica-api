import { RatingSummary, buildRatingSummary } from "@/domain/reviews/entities/RatingSummary";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";

/** Rating summary (average, count, per-star distribution) of the PUBLISHED reviews matching `where`. */
export async function publishedRatingSummary(
  client: Prisma.TransactionClient,
  where: Prisma.ReviewWhereInput,
): Promise<RatingSummary> {
  const groups = await client.review.groupBy({
    by: ["rating"],
    where: { ...where, status: "PUBLISHED" },
    _count: { _all: true },
  });
  return buildRatingSummary(groups.map((group) => ({ rating: group.rating, count: group._count._all })));
}
