import DataException from "@/domain/core/errors/DataError";

export const PLATFORMS = ["ANDROID", "IOS"] as const;
export type Platform = (typeof PLATFORMS)[number];

export function parsePlatform(value: unknown): Platform {
  if (typeof value === "string" && (PLATFORMS as readonly string[]).includes(value)) {
    return value as Platform;
  }
  throw new DataException("La plataforma no es válida");
}
