import "dotenv/config";
import { prisma } from "../client";
import { CATEGORIES } from "./data/categories";
import {
  CANTONS,
  PROVINCES,
  type CantonSeed,
  type ProvinceSeed,
} from "./data/geography";

const EXPECTED_PROVINCES = 7;
const EXPECTED_CANTONS = 84;

export function validateSeedData(
  provinces: readonly ProvinceSeed[],
  cantons: readonly CantonSeed[],
  categories: readonly string[],
): void {
  const errors: string[] = [];

  if (provinces.length !== EXPECTED_PROVINCES) {
    errors.push(`Expected ${EXPECTED_PROVINCES} provinces, got ${provinces.length}`);
  }
  if (cantons.length !== EXPECTED_CANTONS) {
    errors.push(`Expected ${EXPECTED_CANTONS} cantons, got ${cantons.length}`);
  }

  const provinceIds = new Set(provinces.map((p) => p.id));
  if (provinceIds.size !== provinces.length) errors.push("Duplicate province ids");
  if (new Set(provinces.map((p) => p.name)).size !== provinces.length) {
    errors.push("Duplicate province names");
  }

  if (new Set(cantons.map((c) => c.id)).size !== cantons.length) {
    errors.push("Duplicate canton ids");
  }
  const cantonKeys = new Set(cantons.map((c) => `${c.provinceId}:${c.name}`));
  if (cantonKeys.size !== cantons.length) {
    errors.push("Duplicate canton name within a province");
  }

  for (const canton of cantons) {
    if (!provinceIds.has(canton.provinceId)) {
      errors.push(`Canton ${canton.id} references unknown province ${canton.provinceId}`);
    }
    if (Math.floor(canton.id / 100) !== canton.provinceId) {
      errors.push(`Canton ${canton.id} id does not match province ${canton.provinceId}`);
    }
  }

  if (new Set(categories).size !== categories.length) errors.push("Duplicate categories");

  if (errors.length > 0) {
    throw new Error(`Invalid seed data:\n- ${errors.join("\n- ")}`);
  }
}

export async function main(): Promise<void> {
  validateSeedData(PROVINCES, CANTONS, CATEGORIES);

  await prisma.$transaction(
    async (tx) => {
      for (const { id, name } of PROVINCES) {
        await tx.province.upsert({
          where: { id },
          update: { name },
          create: { id, name },
        });
      }

      for (const { id, provinceId, name } of CANTONS) {
        await tx.canton.upsert({
          where: { id },
          update: { name, provinceId },
          create: { id, provinceId, name },
        });
      }

      for (const name of CATEGORIES) {
        await tx.category.upsert({
          where: { name },
          update: {},
          create: { name },
        });
      }
    },
    { timeout: 60_000, maxWait: 10_000 },
  );

  console.log(
    `Seed complete: ${PROVINCES.length} provinces, ${CANTONS.length} cantons, ${CATEGORIES.length} categories`,
  );
}

if (require.main === module) {
  main()
    .catch((error: unknown) => {
      console.error("Seed failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
