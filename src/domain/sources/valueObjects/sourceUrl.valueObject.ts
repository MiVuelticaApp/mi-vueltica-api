import DataException from "@/domain/core/errors/DataError";

export const SOURCE_URL_MAX_LENGTH = 2048;

/** Optional http(s) URL. An empty/absent value is stored as `null`. */
export class SourceUrl {
  private constructor(private readonly _value: string | null) {}

  static create(value: string | null | undefined) {
    if (value === null || value === undefined) return new SourceUrl(null);
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) return new SourceUrl(null);
    if (trimmed.length > SOURCE_URL_MAX_LENGTH) {
      throw new DataException(`La URL de la fuente no puede exceder ${SOURCE_URL_MAX_LENGTH} caracteres`);
    }
    if (!SourceUrl.isHttpUrl(trimmed)) {
      throw new DataException("La URL de la fuente debe ser una URL http o https válida");
    }
    return new SourceUrl(trimmed);
  }

  static isHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  get value() {
    return this._value;
  }
}
