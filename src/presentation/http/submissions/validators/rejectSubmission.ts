import z from "zod";
import { REVIEW_NOTE_MAX_LENGTH } from "@/domain/submissions/valueObjects/reviewNote.valueObject";

export const RejectSubmissionSchema = z.object({
  reason: z
    .string({ error: "El motivo es requerido" })
    .trim()
    .min(1, { message: "El motivo es requerido" })
    .max(REVIEW_NOTE_MAX_LENGTH, { message: `El motivo no puede exceder ${REVIEW_NOTE_MAX_LENGTH} caracteres` }),
});
