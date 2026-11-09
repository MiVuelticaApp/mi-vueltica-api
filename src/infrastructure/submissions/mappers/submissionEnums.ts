import { RejectionReason } from "@/domain/submissions/valueObjects/rejectionReason.valueObject";
import { SubmissionRejectionReason as DbRejectionReason } from "@/infrastructure/prisma/generated/prisma/client";

// The API speaks the app's strings; the database keeps uppercase enums like the rest of the schema.
const REJECTION_REASON_TO_DB: Record<RejectionReason, DbRejectionReason> = {
  duplicado: "DUPLICATE",
  masDe5000: "OVER_5000",
  eventoPasado: "PAST_EVENT",
  datosIncompletos: "INCOMPLETE",
  ubicacionIncorrecta: "WRONG_LOCATION",
  noEsPublico: "NOT_PUBLIC",
  inapropiado: "INAPPROPRIATE",
  spam: "SPAM",
  otro: "OTHER",
};

const REJECTION_REASON_FROM_DB = Object.fromEntries(
  Object.entries(REJECTION_REASON_TO_DB).map(([code, db]) => [db, code]),
) as Record<DbRejectionReason, RejectionReason>;

export const rejectionReasonToDb = (reason: RejectionReason | null): DbRejectionReason | null =>
  reason ? REJECTION_REASON_TO_DB[reason] : null;

export const rejectionReasonFromDb = (reason: DbRejectionReason | null): RejectionReason | null =>
  reason ? REJECTION_REASON_FROM_DB[reason] : null;
