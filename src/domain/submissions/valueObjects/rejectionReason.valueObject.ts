import DataException from "@/domain/core/errors/DataError";

/**
 * Why a moderator rejected a submission (#40). Codes are the strings the API and the app share
 * (the app keeps the same list in its `src/domain/types.ts`); `otro` needs a written note.
 */
export const REJECTION_REASONS = [
  "duplicado",
  "masDe5000",
  "eventoPasado",
  "datosIncompletos",
  "ubicacionIncorrecta",
  "noEsPublico",
  "inapropiado",
  "spam",
  "otro",
] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

/** Text shown to the author for each code (es-CR). `otro` shows the moderator's note instead. */
export const REJECTION_REASON_LABELS: Record<Exclude<RejectionReason, "otro">, string> = {
  duplicado: "Ya existe en Mi Vueltica",
  masDe5000: "Cuesta más de ₡5.000",
  eventoPasado: "El evento ya pasó",
  datosIncompletos: "Faltan datos o no se pudieron verificar",
  ubicacionIncorrecta: "La ubicación no es correcta",
  noEsPublico: "No es un lugar o evento abierto al público",
  inapropiado: "Contenido inapropiado",
  spam: "Spam o publicidad",
};

export const REJECTION_NOTE_REQUIRED_ERROR = "Escribe el motivo cuando eliges otro";

export function isRejectionReason(value: unknown): value is RejectionReason {
  return typeof value === "string" && (REJECTION_REASONS as readonly string[]).includes(value);
}

export function parseRejectionReason(value: unknown): RejectionReason {
  if (isRejectionReason(value)) return value;
  throw new DataException(`reason debe ser uno de: ${REJECTION_REASONS.join(", ")}`);
}

/**
 * What the author reads: the label of the code, or the note for `otro`. Rejections from before #40
 * have no code, only the note.
 */
export function rejectionMessage(reason: RejectionReason | null, note: string | null): string | null {
  if (reason && reason !== "otro") return REJECTION_REASON_LABELS[reason];
  return note;
}
