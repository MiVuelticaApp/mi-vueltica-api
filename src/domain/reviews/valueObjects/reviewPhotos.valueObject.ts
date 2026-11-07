import DataException from "@/domain/core/errors/DataError";

export const REVIEW_MAX_PHOTOS = 5;

/** URLs of the photos attached to a review (each must be one of the author's uploads, checked by the service). */
export function normalizeReviewPhotoUrls(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value) || value.some((url) => typeof url !== "string")) {
    throw new DataException("photos debe ser una lista de URLs");
  }
  const urls = value.map((url: string) => url.trim());
  if (urls.length > REVIEW_MAX_PHOTOS) {
    throw new DataException(`Una reseña puede tener como máximo ${REVIEW_MAX_PHOTOS} fotos`);
  }
  if (new Set(urls).size !== urls.length) throw new DataException("photos no puede repetir la misma foto");
  return urls;
}
