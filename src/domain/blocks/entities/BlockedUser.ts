import { PlanTargetType } from "@/domain/community/valueObjects/planTarget.valueObject";

/** What the caller wants to block the author of: a place, an event or a review. */
export type BlockTarget = { type: PlanTargetType | "REVIEW"; id: string };

/** One row of the caller's blocked list ("Personas bloqueadas"): the block itself and who it blocks. */
export interface BlockedUser {
  /** The block's id (`DELETE /me/blocks/:id`), not the blocked user's. */
  id: string;
  /** The blocked person's first name only, like the author of a review. */
  name: string;
  createdAt: Date;
}
