import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

export const HIDDEN_REASON_MAX_LENGTH = 191;

/** Extra fields when inserting a Place / Event. */
export interface CreatePlanOptions {
  authorId?: string | null;
}

export interface PlanCommunityProps {
  authorId?: string | null;
  hiddenReason?: string | null;
  reportedAt?: Date | null;
}

/**
 * Community fields shared by Place and Event (#39): who submitted the plan (null for team content or a
 * deleted account), why it is hidden and, while it waits for a moderator's decision on its reports,
 * since when. A hidden plan is ARCHIVED; `hiddenReason` is shown to its author.
 */
export class PlanCommunity {
  private constructor(
    readonly authorId: string | null,
    readonly hiddenReason: string | null,
    readonly reportedAt: Date | null,
  ) {}

  static create(props: PlanCommunityProps): PlanCommunity {
    const reason = props.hiddenReason?.trim() || null;
    return new PlanCommunity(
      props.authorId ?? null,
      reason ? reason.slice(0, HIDDEN_REASON_MAX_LENGTH) : null,
      props.reportedAt ?? null,
    );
  }

  isAuthoredBy(userId: string): boolean {
    return this.authorId !== null && this.authorId === userId;
  }

  /** Leaving ARCHIVED (e.g. a moderator publishes it again) clears the reason and the report flag. */
  afterStatusChange(next: ContentStatus): PlanCommunity {
    return next === "ARCHIVED" ? this : new PlanCommunity(this.authorId, null, null);
  }
}
