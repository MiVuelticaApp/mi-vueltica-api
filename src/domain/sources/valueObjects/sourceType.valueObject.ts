import DataException from "@/domain/core/errors/DataError";

export const SOURCE_TYPES = ["CRAWLER", "COMMUNITY", "TEAM"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export function parseSourceType(value: unknown): SourceType {
  if (typeof value === "string" && (SOURCE_TYPES as readonly string[]).includes(value)) {
    return value as SourceType;
  }
  throw new DataException("El tipo de fuente no es válido");
}
