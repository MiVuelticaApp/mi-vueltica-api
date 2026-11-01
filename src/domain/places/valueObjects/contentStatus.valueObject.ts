import DataException from "@/domain/core/errors/DataError";

// Mirrors the Prisma enum so the domain never depends on the generated client.
export const CONTENT_STATUSES = ["PENDING", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export function parseContentStatus(value: unknown): ContentStatus {
  if (typeof value === "string" && (CONTENT_STATUSES as readonly string[]).includes(value)) {
    return value as ContentStatus;
  }
  throw new DataException("El estado no es válido");
}
