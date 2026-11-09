import z from "zod";
import { REVIEW_NOTE_MAX_LENGTH } from "@/domain/submissions/valueObjects/reviewNote.valueObject";
import {
  REJECTION_NOTE_REQUIRED_ERROR,
  REJECTION_REASONS,
  isRejectionReason,
} from "@/domain/submissions/valueObjects/rejectionReason.valueObject";

const noteField = z
  .string({ error: "La nota debe ser texto" })
  .trim()
  .max(REVIEW_NOTE_MAX_LENGTH, { message: `La nota no puede exceder ${REVIEW_NOTE_MAX_LENGTH} caracteres` });

/**
 * `{ reason, note? }`. `reason` is one of `REJECTION_REASONS`; `otro` requires `note`.
 *
 * Compatibility (temporary, until the app sends codes): any other text in `reason` is how clients
 * rejected before #40 (free text), so it is kept as the note of `otro` instead of failing.
 */
export const RejectSubmissionSchema = z
  .object({
    reason: z
      .string({ error: "El motivo es requerido" })
      .trim()
      .min(1, { message: "El motivo es requerido" })
      .max(REVIEW_NOTE_MAX_LENGTH, { message: `El motivo no puede exceder ${REVIEW_NOTE_MAX_LENGTH} caracteres` })
      .describe(`Uno de: ${REJECTION_REASONS.join(", ")}. Texto libre se acepta temporalmente y se guarda como \`otro\`.`),
    note: noteField.nullish(),
  })
  .transform(({ reason, note }) =>
    isRejectionReason(reason)
      ? { reason, note: note || null }
      : { reason: "otro" as const, note: reason },
  )
  .refine((rejection) => rejection.reason !== "otro" || !!rejection.note, {
    path: ["note"],
    message: REJECTION_NOTE_REQUIRED_ERROR,
  });
