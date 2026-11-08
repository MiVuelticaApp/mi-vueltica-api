/** A verification or report is about exactly one Place or one Event (enforced by the application). */
export const PLAN_TARGET_TYPES = ["PLACE", "EVENT"] as const;
export type PlanTargetType = (typeof PLAN_TARGET_TYPES)[number];

export interface PlanTarget {
  type: PlanTargetType;
  id: string;
}
