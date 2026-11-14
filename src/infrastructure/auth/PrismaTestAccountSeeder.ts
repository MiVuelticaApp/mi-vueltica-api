import { ITestAccountSeeder } from "@/application/auth/services/interfaces/ITestAccountSeeder";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";

/**
 * Sample data for the App Store / Google Play review account (#8), so reviewers land on a populated
 * Guardados, "Mis vuelticas" and "Mis reseñas" instead of empty screens. Runs on the first test login.
 *
 * Rules: it only points at existing PUBLISHED plans (the curated records) and never creates public
 * content: the suggestions and the review stay private to the account (the approved suggestion links
 * to an existing place without making the reviewer its author; the review is PENDING). Idempotent
 * (skips an account that already has favorites or suggestions) and never throws: a failure must not
 * block the login token.
 */
export class PrismaTestAccountSeeder implements ITestAccountSeeder {
  constructor(private readonly client: Prisma.TransactionClient = prisma) {}

  async seed(userId: string): Promise<void> {
    try {
      const [favorites, submissions] = await Promise.all([
        this.client.favorite.count({ where: { userId } }),
        this.client.submission.count({ where: { userId } }),
      ]);
      if (favorites > 0 || submissions > 0) return;

      const places = await this.client.place.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "asc" },
        take: 4,
      });
      const events = await this.client.event.findMany({
        where: { status: "PUBLISHED", OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
        orderBy: { startsAt: "asc" },
        take: 2,
        select: { id: true },
      });

      await this.client.favorite.createMany({
        data: [
          ...places.slice(0, 3).map((p) => ({ userId, placeId: p.id })),
          ...events.map((e) => ({ userId, eventId: e.id })),
        ],
        skipDuplicates: true,
      });

      const placeData = (p: (typeof places)[number], name = p.name) => ({
        cantonId: p.cantonId,
        categoryId: p.categoryId,
        name,
        description: p.description ?? undefined,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        address: p.address ?? undefined,
        pricePerPerson: p.pricePerPerson ?? undefined,
      });

      const [approved, pending] = [places[0], places[3] ?? places[0]];
      if (approved) {
        await this.client.submission.create({
          data: {
            userId,
            type: "PLACE",
            data: placeData(approved),
            status: "PUBLISHED",
            reviewedAt: new Date(),
            createdPlaceId: approved.id,
          },
        });
      }
      if (pending) {
        await this.client.submission.create({
          data: { userId, type: "PLACE", data: placeData(pending, `${pending.name} (sugerencia de ejemplo)`), status: "PENDING" },
        });
      }

      const reviewed = places[1];
      if (reviewed) {
        await this.client.review.create({
          data: {
            userId,
            placeId: reviewed.id,
            rating: 5,
            comment: "Muy buen plan, fácil de llegar y barato. Reseña de ejemplo de la cuenta de revisión.",
            status: "PENDING",
          },
        });
      }
    } catch (error) {
      // The demo seed is a nice-to-have, not part of the login contract.
      console.error("[test-login] demo seed failed:", error);
    }
  }
}
