import DataException from "@/domain/core/errors/DataError";

export const PHOTO_URL_MAX_LENGTH = 2048;

export interface PhotoUrlOptions {
  /**
   * External URLs must be https. Our own file URLs are built by the API from `PUBLIC_API_URL`
   * and may be plain http in local development.
   */
  requireHttps?: boolean;
}

export class PhotoUrl {
  private constructor(private readonly _value: string) {}

  static create(value: unknown, { requireHttps = true }: PhotoUrlOptions = {}) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) throw new DataException("La URL de la foto es requerida");
    if (trimmed.length > PHOTO_URL_MAX_LENGTH) {
      throw new DataException(`La URL de la foto no puede exceder ${PHOTO_URL_MAX_LENGTH} caracteres`);
    }
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      throw new DataException("La URL de la foto no es válida");
    }
    const allowed = requireHttps ? ["https:"] : ["https:", "http:"];
    if (!allowed.includes(url.protocol)) {
      throw new DataException(requireHttps ? "La URL de la foto debe usar https" : "La URL de la foto debe ser http(s)");
    }
    return new PhotoUrl(trimmed);
  }

  get value() {
    return this._value;
  }
}
