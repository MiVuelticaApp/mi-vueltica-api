import { ICommunityContext, ICommunityUnitOfWork } from "@/domain/community/unitsOfWork/CommunityUnitOfWork";
import { CommunityPhoto, IReportRepository, IVerificationRepository } from "@/domain/community/repositories/ICommunityRepositories";
import { PlanState } from "@/domain/community/entities/PlanState";
import { ReportQueueItem } from "@/domain/community/entities/Report";
import { VerificationSummary } from "@/domain/community/entities/Verification";
import { PersonKey } from "@/domain/community/valueObjects/personKey.valueObject";
import { PlanTarget } from "@/domain/community/valueObjects/planTarget.valueObject";
import {
  parseCorrectedTime,
  parsePricePaid,
  parseStillHappening,
} from "@/domain/community/valueObjects/verificationAnswers.valueObject";
import { parseReportDetails, parseReportReason } from "@/domain/community/valueObjects/reportReason.valueObject";
import {
  outcomeOfVerifications,
  priceForTier,
  startOfCostaRicaDay,
} from "@/domain/community/rules/verificationRules";
import {
  HIDDEN_REASON_MODERATION,
  HIDDEN_REASON_REPORTED,
  ReportDecision,
  reportsHide,
} from "@/domain/community/rules/reportRules";
import { countsPrice, verificationWeight } from "@/domain/reputation/reputationRules";
import { reputationCause } from "@/domain/reputation/entities/ReputationEvent";
import { ReputationLedger } from "@/application/reputation/services/ReputationLedger";
import DataException from "@/domain/core/errors/DataError";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { PlaceNotFoundError } from "@/application/places/errors/PlaceNotFoundError";
import { EventNotFoundError } from "@/application/events/errors/EventNotFoundError";
import { UnauthorizedError } from "@/application/core/errors/UnauthorizedError";
import { IUploadService } from "@/application/uploads/services/interfaces/IUploadService";
import { ReportAlreadyExistsError } from "../../errors/ReportAlreadyExistsError";
import { NoPendingReportsError } from "../../errors/NoPendingReportsError";
import {
  ICommunityService,
  ReportDecisionResult,
  ReportInput,
  ReportResult,
  VerifyInput,
  VerifyResult,
} from "../interfaces/ICommunityService";

function notFound(target: PlanTarget): Error {
  return target.type === "PLACE" ? new PlaceNotFoundError() : new EventNotFoundError();
}

export class CommunityService implements ICommunityService {
  constructor(
    private readonly unitOfWork: ICommunityUnitOfWork,
    private readonly verificationRepository: IVerificationRepository,
    private readonly reportRepository: IReportRepository,
    private readonly uploadService: IUploadService,
  ) {}

  async verify(person: PersonKey, target: PlanTarget, input: VerifyInput): Promise<VerifyResult> {
    // Validate before touching the database (400 instead of a failed query).
    const stillHappening = parseStillHappening(input.stillHappening);
    const pricePaid = parsePricePaid(input.pricePaid);
    const correctedTime = parseCorrectedTime(input.correctedTime);
    if (input.scheduleCorrect !== undefined && input.scheduleCorrect !== null && typeof input.scheduleCorrect !== "boolean") {
      throw new DataException("scheduleCorrect debe ser verdadero o falso");
    }
    const photo = await this.resolvePhoto(person, input.photo);
    const now = new Date();

    return this.unitOfWork.runInTransaction(async (ctx) => {
      const state = await this.lockPublished(ctx, target);
      // Lock the verifier right after the plan: before any plain read and before inserting the row that
      // references them (see ReputationLedger; without it concurrent verifications deadlocked).
      if (person.userId !== null) await ctx.getReputationRepository().lockPoints(person.userId);
      const verifications = ctx.getVerificationRepository();
      await verifications.save({
        target,
        personKey: person.value,
        userId: person.userId,
        stillHappening,
        pricePaid,
        scheduleCorrect: input.scheduleCorrect ?? null,
        correctedTime,
        photo,
        now,
      });
      const plans = ctx.getPlanStateRepository();
      if (stillHappening === "si") await plans.markVerified(target, now);

      // +2 the first time a signed-in person verifies this plan (answering again gives nothing).
      const points =
        person.userId === null
          ? 0
          : await ReputationLedger.award(ctx.getReputationRepository(), {
              userId: person.userId,
              kind: "verified",
              causeKey: reputationCause.verification(target.type, target.id, person.userId),
              at: now,
            });

      // Price answers count from level 2 and level 4+ counts double (read after this verifier's points).
      const counting = (await verifications.listCounting(target)).map((v) => ({
        stillHappening: v.stillHappening,
        pricePaid: countsPrice(v.userPoints) ? v.pricePaid : null,
        weight: verificationWeight(v.userPoints),
      }));
      const outcome = outcomeOfVerifications(counting);
      if (outcome.kind === "none") return { queued: false, points, hidden: false };

      if (outcome.kind === "hide") {
        await plans.hide(target, outcome.reason, null);
      } else {
        await plans.setPrice(target, priceForTier(state.pricePerPerson, outcome.tier));
      }
      // Like the app: the answers that produced an outcome do not count towards the next one.
      await verifications.consumeAll(target, now);
      return { queued: false, points, hidden: outcome.kind === "hide" };
    });
  }

  async report(person: PersonKey, target: PlanTarget, input: ReportInput): Promise<ReportResult> {
    const reason = parseReportReason(input.reason);
    const details = parseReportDetails(input.details);
    const photo = await this.resolvePhoto(person, input.photo);

    return this.unitOfWork.runInTransaction(async (ctx) => {
      await this.lockPublished(ctx, target);
      const reports = ctx.getReportRepository();
      // Reliable because the plan row is locked; a race on the unique index would still be a 409 (P2002).
      if (await reports.existsForPerson(target, person.value)) throw new ReportAlreadyExistsError();
      const report = await reports.create({ target, personKey: person.value, userId: person.userId, reason, details, photo });

      const { hide } = reportsHide(await reports.unresolvedReasons(target));
      if (hide) await ctx.getPlanStateRepository().hide(target, HIDDEN_REASON_REPORTED, new Date());
      return { report, hidden: hide };
    });
  }

  async verificationSummary(target: PlanTarget, person: PersonKey | null): Promise<VerificationSummary> {
    return this.verificationRepository.summary(target, person?.value ?? null, startOfCostaRicaDay(new Date()));
  }

  async reportQueue(params: PaginationParams): Promise<PaginatedResult<ReportQueueItem>> {
    return this.reportRepository.queue(params, new Date());
  }

  async decide(target: PlanTarget, decision: ReportDecision): Promise<ReportDecisionResult> {
    return this.unitOfWork.runInTransaction(async (ctx) => {
      const plans = ctx.getPlanStateRepository();
      const state = await plans.lock(target);
      if (!state) throw notFound(target);
      // Lock the author before any plain read (they may lose points below; see ReputationLedger).
      if (state.authorId) await ctx.getReputationRepository().lockPoints(state.authorId);
      const reports = ctx.getReportRepository();
      if ((await reports.unresolvedReasons(target)).length === 0) throw new NoPendingReportsError();

      const now = new Date();
      if (decision === "keep") {
        await plans.publish(target);
      } else {
        await plans.hide(target, HIDDEN_REASON_MODERATION, null);
        // Confirmed reports cost the author 5 points (team content has no author).
        if (state.authorId) {
          await ReputationLedger.award(ctx.getReputationRepository(), {
            userId: state.authorId,
            kind: "reported",
            causeKey: reputationCause.planHidden(target.type, target.id, now),
            at: now,
          });
        }
      }
      const resolvedReports = await reports.resolveAll(target, now);
      return {
        target,
        status: decision === "keep" ? "PUBLISHED" : "ARCHIVED",
        hiddenReason: decision === "keep" ? null : HIDDEN_REASON_MODERATION,
        resolvedReports,
      };
    });
  }

  /** Only PUBLISHED plans can be verified or reported; anything else is reported as not found. */
  private async lockPublished(ctx: ICommunityContext, target: PlanTarget): Promise<PlanState> {
    const state = await ctx.getPlanStateRepository().lock(target);
    if (!state || state.status !== "PUBLISHED") throw notFound(target);
    return state;
  }

  /** Photos must be the caller's own uploads, so guests (who cannot upload) cannot attach one. */
  private async resolvePhoto(person: PersonKey, url: string | null | undefined): Promise<CommunityPhoto | null> {
    if (url === null || url === undefined || url.trim() === "") return null;
    if (person.userId === null) throw new UnauthorizedError("Iniciá sesión para adjuntar una foto");
    const [resolved] = await this.uploadService.resolveOwnUploads(person.userId, [url.trim()]);
    return resolved;
  }
}
