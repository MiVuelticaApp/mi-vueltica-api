/** What an automatic check thinks of a suggestion's text (#5). */
export interface ModerationVerdict {
  /** 0 (fine) to 1 (surely inappropriate / spam). */
  score: number;
  /** Flagged categories, e.g. ["harassment", "spam"]; empty when nothing was flagged. */
  reasons: string[];
}

/** An external moderation API. Returns null when it is not configured, times out or fails (fail open). */
export interface IContentModerator {
  check(text: string): Promise<ModerationVerdict | null>;
}

const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi;
const PHONE_RE = /(?:\+?506[\s-]?)?\b\d{4}[\s-]?\d{4}\b/g;
const PROMO_RE = /\b(?:gan[aá] dinero|promoci[oó]n|descuento|whatsapp|escrib[ií]me|inbox|compr[aá] ya|oferta|cripto|bitcoin|inversi[oó]n)\b/gi;

/**
 * Cheap spam signals the moderation API does not cover (it looks for offensive content, not ads): links, phone
 * numbers, promo words, shouting and repeated characters. Pure and local, so it runs even without an API key.
 */
export function spamVerdict(text: string): ModerationVerdict {
  let score = 0;
  const reasons: string[] = [];
  const add = (s: number, r: string) => {
    score = Math.max(score, s);
    if (!reasons.includes(r)) reasons.push(r);
  };
  const links = text.match(URL_RE)?.length ?? 0;
  if (links >= 2) add(0.8, "spam: enlaces");
  else if (links === 1) add(0.4, "spam: enlace");
  if ((text.match(PHONE_RE)?.length ?? 0) > 0) add(0.5, "spam: teléfono");
  const promos = text.match(PROMO_RE)?.length ?? 0;
  if (promos >= 2) add(0.8, "spam: publicidad");
  else if (promos === 1) add(0.4, "spam: publicidad");
  const letters = text.replace(/[^a-záéíóúñü]/gi, "");
  if (letters.length >= 20 && letters === letters.toUpperCase()) add(0.4, "spam: mayúsculas");
  if (/(.)\1{5,}/.test(text)) add(0.4, "spam: caracteres repetidos");
  // Several weak signals together are a strong one.
  if (reasons.length >= 3) score = Math.max(score, 0.8);
  return { score: reasons.length ? score : 0, reasons };
}

/** The highest score wins; the reasons of both. */
export function combineVerdicts(...vs: (ModerationVerdict | null)[]): ModerationVerdict | null {
  const present = vs.filter((v): v is ModerationVerdict => !!v);
  if (!present.length) return null;
  return {
    score: Math.max(...present.map((v) => v.score)),
    reasons: [...new Set(present.flatMap((v) => v.reasons))],
  };
}
