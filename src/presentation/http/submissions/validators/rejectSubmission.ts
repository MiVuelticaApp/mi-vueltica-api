import z from "zod";
import { REVIEW_NOTE_MAX_LENGTH } from "@/domain/submissions/valueObjects/reviewNote.valueObject";
import {
  REJECTION_NOTE_REQUIRED_ERROR,
  REJECTION_REASONS,
} from "@/domain/submissions/valueObjects/rejectionReason.valueObject";

const noteField = z
  .string({ error: "La nota debe ser texto" })
  .trim()
  .max(REVIEW_NOTE_MAX_LENGTH, { message: `La nota no puede exceder ${REVIEW_NOTE_MAX_LENGTH} caracteres` });

/**
 * `{ reason, note? }`. `reason` is one of `REJECTION_REASONS`; `otro` requires `note`. The free-text
 * compatibility of #40 is gone (app issue #9): the app sends the codes, so any other text is a 400.
 */
export const RejectSubmissionSchema = z
  .object({
    reason: z.enum(REJECTION_REASONS, { error: `El motivo debe ser uno de: ${REJECTION_REASONS.join(", ")}` }),
    note: noteField.nullish(),
  })
  .transform(({ reason, note }) => ({ reason, note: note || null }))
  .refine((rejection) => rejection.reason !== "otro" || !!rejection.note, {
    path: ["note"],
    message: REJECTION_NOTE_REQUIRED_ERROR,
  });
