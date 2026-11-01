import DataException from "@/domain/core/errors/DataError";

// Mirrors the Prisma enum so the domain never depends on the generated client.
export const TARGET_AUDIENCES = ["EVERYONE", "CHILDREN", "ADULTS", "SENIORS"] as const;
export type TargetAudience = (typeof TARGET_AUDIENCES)[number];

export function parseTargetAudience(value: unknown): TargetAudience {
  if (typeof value === "string" && (TARGET_AUDIENCES as readonly string[]).includes(value)) {
    return value as TargetAudience;
  }
  throw new DataException("El público objetivo no es válido");
}
