import { PricePaid, StillHappening } from "@/domain/community/valueObjects/verificationAnswers.valueObject";
import { ReportReason } from "@/domain/community/valueObjects/reportReason.valueObject";
import { PlanTarget } from "@/domain/community/valueObjects/planTarget.valueObject";
import {
  PricePaid as DbPricePaid,
  ReportReason as DbReportReason,
  StillHappening as DbStillHappening,
} from "@/infrastructure/prisma/generated/prisma/client";

// The API speaks the app's strings; the database keeps uppercase enums like the rest of the schema.
const STILL_HAPPENING_TO_DB: Record<StillHappening, DbStillHappening> = { si: "YES", no: "NO", nose: "DONT_KNOW" };
const PRICE_PAID_TO_DB: Record<PricePaid, DbPricePaid> = {
  gratis: "FREE",
  menos2500: "UNDER_2500",
  entre2500y5000: "FROM_2500_TO_5000",
  mas5000: "OVER_5000",
};
const REPORT_REASON_TO_DB: Record<ReportReason, DbReportReason> = {
  cerro: "CLOSED",
  noGratis: "NOT_FREE",
  masDe5000: "OVER_5000",
  horario: "SCHEDULE",
  inapropiado: "INAPPROPRIATE",
  spam: "SPAM",
  otro: "OTHER",
};

const invert = <K extends string, V extends string>(map: Record<K, V>) =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<V, K>;
const STILL_HAPPENING_FROM_DB = invert(STILL_HAPPENING_TO_DB);
const PRICE_PAID_FROM_DB = invert(PRICE_PAID_TO_DB);
const REPORT_REASON_FROM_DB = invert(REPORT_REASON_TO_DB);

export const stillHappeningToDb = (value: StillHappening) => STILL_HAPPENING_TO_DB[value];
export const stillHappeningFromDb = (value: DbStillHappening) => STILL_HAPPENING_FROM_DB[value];
export const pricePaidToDb = (value: PricePaid | null) => (value ? PRICE_PAID_TO_DB[value] : null);
export const pricePaidFromDb = (value: DbPricePaid | null) => (value ? PRICE_PAID_FROM_DB[value] : null);
export const reportReasonToDb = (value: ReportReason) => REPORT_REASON_TO_DB[value];
export const reportReasonFromDb = (value: DbReportReason) => REPORT_REASON_FROM_DB[value];

/** `where` / `data` fragment selecting the plan's column. */
export function targetColumns(target: PlanTarget): { placeId: string } | { eventId: string } {
  return target.type === "PLACE" ? { placeId: target.id } : { eventId: target.id };
}

/** The target of a Verification / Report row (exactly one of the two columns is set). */
export function targetOfRow(row: { placeId: string | null; eventId: string | null }): PlanTarget {
  if ((row.placeId === null) === (row.eventId === null)) {
    throw new Error("Community row must reference exactly one Place or Event");
  }
  return row.placeId !== null ? { type: "PLACE", id: row.placeId } : { type: "EVENT", id: row.eventId as string };
}
