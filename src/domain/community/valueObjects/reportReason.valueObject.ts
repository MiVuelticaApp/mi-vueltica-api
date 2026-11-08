import DataException from "@/domain/core/errors/DataError";

/** App values (`ReportReason` in mi-vueltica-app). */
export const REPORT_REASONS = ["cerro", "noGratis", "masDe5000", "horario", "inapropiado", "spam", "otro"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_DETAILS_MAX_LENGTH = 1000;

export function parseReportReason(value: unknown): ReportReason {
  if (typeof value === "string" && (REPORT_REASONS as readonly string[]).includes(value)) return value as ReportReason;
  throw new DataException(`reason debe ser uno de: ${REPORT_REASONS.join(", ")}`);
}

/** Optional free text. Trimmed; blank → null. */
export function parseReportDetails(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new DataException("details debe ser texto");
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > REPORT_DETAILS_MAX_LENGTH) {
    throw new DataException(`details no puede exceder ${REPORT_DETAILS_MAX_LENGTH} caracteres`);
  }
  return trimmed;
}
