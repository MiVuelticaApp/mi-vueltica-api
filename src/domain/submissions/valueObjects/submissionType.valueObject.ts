import DataException from "@/domain/core/errors/DataError";

export const SUBMISSION_TYPES = ["PLACE", "EVENT"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export function parseSubmissionType(value: unknown): SubmissionType {
  if (typeof value === "string" && (SUBMISSION_TYPES as readonly string[]).includes(value)) {
    return value as SubmissionType;
  }
  throw new DataException(`El tipo de sugerencia debe ser uno de: ${SUBMISSION_TYPES.join(", ")}`);
}
