import { ReputationKind } from "../reputationRules";
import { ReputationEvent } from "../entities/ReputationEvent";

export interface NewReputationEntry {
  userId: string;
  kind: ReputationKind;
  delta: number;
  causeKey: string;
  createdAt: Date;
}

export interface ReputationEntry {
  userId: string;
  delta: number;
}

/**
 * Ledger of reputation changes plus the cached total in `User.reputationPoints`.
 * Writes must run on a transaction client, after `lockPoints` on the user (see ReputationLedger).
 */
export interface IReputationRepository {
  /** Locks the user row (`SELECT ... FOR UPDATE`) and returns its points; null if the user does not exist. */
  lockPoints(userId: string): Promise<number | null>;
  findByCause(causeKey: string): Promise<ReputationEntry | null>;
  /** Inserts the entry and adds its delta to the user's total. */
  add(entry: NewReputationEntry): Promise<void>;
  /** Deletes the entry and adds `totalChange` (usually minus its delta) to the user's total. */
  remove(causeKey: string, userId: string, totalChange: number): Promise<void>;
  /** Latest entries first. */
  recent(userId: string, limit: number): Promise<ReputationEvent[]>;
}
