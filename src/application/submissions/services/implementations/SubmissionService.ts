import { Submission } from "@/domain/submissions/entities/Submission";
import {
  SubmissionPayloadInput,
  normalizeSubmissionPayload,
  withSubmissionPhotos,
} from "@/domain/submissions/entities/SubmissionPayload";
import { ISubmissionRepository, SubmissionSortField } from "@/domain/submissions/repositories/ISubmissionRepository";
import {
  ISubmissionApprovalContext,
  ISubmissionApprovalUnitOfWork,
} from "@/domain/submissions/unitsOfWork/SubmissionApprovalUnitOfWork";
import { ReputationLedger } from "@/application/reputation/services/ReputationLedger";
import { reputationCause } from "@/domain/reputation/entities/ReputationEvent";
import {
  COMMUNITY_REJECTION_NOTE,
  VoteChoice,
  canModerate,
  decideNew,
  losingChoice,
  parseVoteChoice,
  votesNeededForSubmission,
} from "@/domain/moderation/moderationRules";
import { ModerationTarget, ModerationVoteResult, tallyVotes } from "@/domain/moderation/entities/ModerationVote";
import {
  MODERATION_LEVEL_ERROR,
  VOTE_TRANSACTION,
  Voter,
  castVote,
  lockUsersInOrder,
  penalizeMinority,
  withdrawVote,
} from "@/application/moderation/services/moderationVoting";
import { ForbiddenError } from "@/application/core/errors/ForbiddenError";
import { UnauthorizedError } from "@/application/core/errors/UnauthorizedError";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { ICategoryRepository } from "@/domain/categories/repositories/ICategoryRepository";
import { ICantonRepository } from "@/domain/geography/repositories/ICantonRepository";
import { ISourceRepository } from "@/domain/sources/repositories/ISourceRepository";
import { COMMUNITY_SOURCE_ID } from "@/domain/sources/communitySource";
import { PhotoOwner } from "@/domain/photos/valueObjects/photoOwner.valueObject";
import { IUploadService } from "@/application/uploads/services/interfaces/IUploadService";
import { PaginatedResult, PaginationParams, SortDirection } from "@/domain/core/pagination/Pagination";
import {
  ISubmissionService,
  SubmissionApprovalResult,
  SubmissionQueueFilters,
  SubmissionRejection,
} from "../interfaces/ISubmissionService";
import { ensureSubmissionReferencesExist } from "../submissionReferences";
import { SubmissionNotFoundError } from "../../errors/SubmissionNotFoundError";
import { SubmissionNotPendingError } from "../../errors/SubmissionNotPendingError";
import { SubmissionTypeChangeError } from "../../errors/SubmissionTypeChangeError";

type Params = PaginationParams<SubmissionSortField>;

/** Applies a default `createdAt` order when the client did not ask for one. */
const withDefaultSort = (params: Params, direction: SortDirection): Params => ({
  ...params,
  sort: params.sort ?? { field: "createdAt", direction },
});

export class SubmissionService implements ISubmissionService {
  constructor(
    private readonly submissionRepository: ISubmissionRepository,
    private readonly placeRepository: IPlaceRepository,
    private readonly cantonRepository: ICantonRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly approvalUOW: ISubmissionApprovalUnitOfWork,
    private readonly uploadService: IUploadService,
  ) {}

  async create(userId: string, input: SubmissionPayloadInput): Promise<Submission> {
    const { payload, uploadIds } = await this.prepare(userId, input);
    return this.submissionRepository.create({ userId, payload, uploadIds });
  }

  async updateMine(userId: string, id: string, input: SubmissionPayloadInput): Promise<Submission> {
    // Validation (400/422) and the upload checks first, outside the transaction.
    const { payload, uploadIds } = await this.prepare(userId, input);
    return this.approvalUOW.runInTransaction(async (ctx) => {
      const submissionRepository = ctx.getSubmissionRepository();
      // Same row lock as approval: an edit and a concurrent approval run one after the other, so a
      // moderator never approves a half-edited suggestion and an edit never lands after approval.
      const submission = await submissionRepository.findForUpdate(id);
      // Someone else's submission is reported as missing, so its existence is not leaked.
      if (!submission || !submission.belongsTo(userId)) throw new SubmissionNotFoundError();
      if (!submission.isPending()) throw new SubmissionNotPendingError("Solo se pueden editar sugerencias pendientes");
      if (submission.type !== payload.type) throw new SubmissionTypeChangeError();
      submission.edit(payload);
      if (!(await submissionRepository.updatePendingOwned(submission, uploadIds))) {
        throw new SubmissionNotPendingError("Solo se pueden editar sugerencias pendientes");
      }
      return submission;
    });
  }

  /**
   * Shared by create and edit: same domain rules as creating a Place/Event (400), the same reference
   * checks (422), and every photo must be one of the author's own uploads (422). Photos are stored in
   * canonical form and linked so the orphan cleanup keeps the files while the submission exists.
   */
  private async prepare(userId: string, input: SubmissionPayloadInput) {
    const payload = normalizeSubmissionPayload(input);
    await ensureSubmissionReferencesExist(payload, {
      placeRepository: this.placeRepository,
      cantonRepository: this.cantonRepository,
      categoryRepository: this.categoryRepository,
    });
    const photos = await this.uploadService.resolveOwnUploads(userId, payload.data.photos);
    return {
      payload: withSubmissionPhotos(payload, photos.map((photo) => photo.url)),
      uploadIds: photos.map((photo) => photo.uploadId),
    };
  }

  async listMine(userId: string, params: Params, filters: SubmissionQueueFilters = {}): Promise<PaginatedResult<Submission>> {
    // `userId` last, so a filter object can never widen the list to other authors.
    return this.submissionRepository.list(withDefaultSort(params, "desc"), { ...filters, userId });
  }

  async getMine(userId: string, id: string): Promise<Submission> {
    const submission = await this.submissionRepository.find(id);
    // Someone else's submission is reported as missing, so its existence is not leaked.
    if (!submission || !submission.belongsTo(userId)) throw new SubmissionNotFoundError();
    return submission;
  }

  async deleteMine(userId: string, id: string): Promise<void> {
    const submission = await this.getMine(userId, id);
    if (!submission.isPending()) throw new SubmissionNotPendingError("Solo se pueden eliminar sugerencias pendientes");
    // Conditional delete: a moderator may have reviewed it after the read above.
    const deleted = await this.submissionRepository.deletePendingOwned(id, userId);
    if (!deleted) throw new SubmissionNotPendingError("Solo se pueden eliminar sugerencias pendientes");
  }

  async listQueue(params: Params, filters: SubmissionQueueFilters = {}): Promise<PaginatedResult<Submission>> {
    // Oldest first: the moderation queue is first come, first served.
    return this.submissionRepository.list(withDefaultSort(params, "asc"), filters);
  }

  async get(id: string): Promise<Submission> {
    const submission = await this.submissionRepository.find(id);
    if (!submission) throw new SubmissionNotFoundError();
    return submission;
  }

  async approve(id: string, reviewerId: string): Promise<SubmissionApprovalResult> {
    // Everything below runs in one transaction: if any step throws, nothing is written.
    return this.approvalUOW.runInTransaction(async (ctx) => {
      const submission = await this.lockPending(ctx, id);
      return this.approveLocked(ctx, submission, reviewerId, new Date());
    });
  }

  async reject(id: string, reviewerId: string, rejection: SubmissionRejection): Promise<Submission> {
    // Same lock as approve: a concurrent approve/reject waits and then gets a clean 409, and the
    // −10 is written together with the rejection.
    return this.approvalUOW.runInTransaction(async (ctx) => {
      const submission = await this.lockPending(ctx, id);
      return this.rejectLocked(ctx, submission, reviewerId, rejection, new Date());
    });
  }

  async vote(voter: Voter, id: string, choice: VoteChoice): Promise<ModerationVoteResult> {
    const parsed = parseVoteChoice(choice);
    const target: ModerationTarget = { type: "SUBMISSION", id };
    return this.approvalUOW.runInTransaction(async (ctx) => {
      const submissionRepository = ctx.getSubmissionRepository();
      const votes = ctx.getModerationVoteRepository();
      const reputation = ctx.getReputationRepository();

      // Locks first, in the fixed order (submission, then every user whose points may change, by id),
      // and before any plain read: see ReputationLedger.
      const authorId = await submissionRepository.lockAuthor(id);
      if (!authorId) throw new SubmissionNotFoundError();
      if (authorId === voter.id) throw new ForbiddenError("No puedes votar tu propia sugerencia");
      const points = await lockUsersInOrder(reputation, [voter.id, authorId, ...(await votes.lockVoterIds(target))]);
      const voterPoints = points.get(voter.id);
      if (voterPoints === undefined) throw new UnauthorizedError();
      if (!canModerate(voter.role, voterPoints)) throw new ForbiddenError(MODERATION_LEVEL_ERROR);

      const submission = await submissionRepository.findForUpdate(id);
      if (!submission) throw new SubmissionNotFoundError();
      if (!submission.isPending()) throw new SubmissionNotPendingError();

      const now = new Date();
      await castVote(votes, reputation, target, voter, voterPoints, parsed, now);
      const all = await votes.list(target);
      const tally = tallyVotes(all, voter.id);
      const votesNeeded = votesNeededForSubmission(points.get(authorId) ?? 0);
      const decision = decideNew(tally, votesNeeded);

      if (decision === "publish") await this.approveLocked(ctx, submission, null, now);
      if (decision === "reject") {
        await this.rejectLocked(ctx, submission, null, { reason: "otro", note: COMMUNITY_REJECTION_NOTE }, now);
      }
      if (decision !== "pending") await penalizeMinority(reputation, all, losingChoice(tally), now);
      return { target, kind: "nueva", ...tally, votesNeeded, decision };
    }, VOTE_TRANSACTION);
  }

  async undoVote(voter: Voter, id: string): Promise<ModerationVoteResult> {
    const target: ModerationTarget = { type: "SUBMISSION", id };
    return this.approvalUOW.runInTransaction(async (ctx) => {
      const submissionRepository = ctx.getSubmissionRepository();
      const votes = ctx.getModerationVoteRepository();
      const reputation = ctx.getReputationRepository();

      const authorId = await submissionRepository.lockAuthor(id);
      if (!authorId) throw new SubmissionNotFoundError();
      const points = await lockUsersInOrder(reputation, [voter.id, authorId]);
      const submission = await submissionRepository.findForUpdate(id);
      if (!submission) throw new SubmissionNotFoundError();
      // A decided suggestion stays decided: its Place/Event already exists (or it was rejected).
      if (!submission.isPending()) throw new SubmissionNotPendingError("La sugerencia ya fue decidida; el voto no se puede deshacer");

      await withdrawVote(votes, reputation, target, voter.id);
      const tally = tallyVotes(await votes.list(target), voter.id);
      return { target, kind: "nueva", ...tally, votesNeeded: votesNeededForSubmission(points.get(authorId) ?? 0), decision: "pending" };
    }, VOTE_TRANSACTION);
  }

  /**
   * Locks a submission for a decision: the row, then its author (before any plain read and before the
   * Place/Event that references them is created; see ReputationLedger). 404 / 409 unless PENDING.
   */
  private async lockPending(ctx: ISubmissionApprovalContext, id: string): Promise<Submission> {
    const submissionRepository = ctx.getSubmissionRepository();
    const authorId = await submissionRepository.lockAuthor(id);
    if (!authorId) throw new SubmissionNotFoundError();
    await ctx.getReputationRepository().lockPoints(authorId);
    const submission = await submissionRepository.findForUpdate(id);
    if (!submission) throw new SubmissionNotFoundError();
    if (!submission.isPending()) throw new SubmissionNotPendingError();
    return submission;
  }

  /**
   * Publishes a locked PENDING submission: creates the Place/Event and its gallery, marks it reviewed
   * and gives the author +10. `reviewerId` is null when the community decided it by vote.
   */
  private async approveLocked(
    ctx: ISubmissionApprovalContext,
    submission: Submission,
    reviewerId: string | null,
    now: Date,
  ): Promise<SubmissionApprovalResult> {
    const submissionRepository = ctx.getSubmissionRepository();
    const placeRepository = ctx.getPlaceRepository();

    // Re-checked inside the transaction: a referenced row may have been deleted since creation.
    await ensureSubmissionReferencesExist(submission.payload, {
      placeRepository,
      cantonRepository: ctx.getCantonRepository(),
      categoryRepository: ctx.getCategoryRepository(),
    });

    const sourceId = await this.resolveCommunitySourceId(ctx.getSourceRepository());
    const payload = submission.payload;
    let created: SubmissionApprovalResult["created"];

    if (payload.type === "PLACE") {
      const { photos: _photos, ...data } = payload.data;
      // Repositories always insert as PENDING; publishing goes through the entity so
      // `verifiedAt` is set exactly as in PATCH /places/:id/status.
      // The submitter becomes the author: they keep seeing the place (and why) if it is ever hidden.
      const place = await placeRepository.create({ ...data, sourceId }, { authorId: submission.userId });
      place.changeStatus("PUBLISHED", now);
      await placeRepository.update(place);
      created = { type: "PLACE", id: place.id };
    } else {
      const { photos: _photos, ...data } = payload.data;
      const eventRepository = ctx.getEventRepository();
      const event = await eventRepository.create({ ...data, sourceId }, { authorId: submission.userId });
      event.changeStatus("PUBLISHED");
      await eventRepository.update(event);
      created = { type: "EVENT", id: event.id };
    }

    // The submission's photos become the new Place/Event gallery, in the submitted order.
    const owner: PhotoOwner = { type: created.type, id: created.id };
    const photoRepository = ctx.getPhotoRepository();
    for (const [position, url] of payload.data.photos.entries()) {
      const uploadId = this.uploadService.uploadIdFromUrl(url);
      if (!uploadId) throw new Error(`Submission ${submission.id} has a photo that is not an upload: ${url}`);
      await photoRepository.create({ owner, url: this.uploadService.urlFor(uploadId), uploadId, position });
    }

    // Records which Place/Event it became, so the author can open it from "Mis vuelticas".
    submission.approve(reviewerId, now, created);
    // Second guard (the row lock is the first): only succeeds if the row is still PENDING;
    // otherwise this throws and the transaction rolls back the Place/Event created above.
    if (!(await submissionRepository.markReviewed(submission))) throw new SubmissionNotPendingError();

    // +10 for the author, in the same transaction: no points without the plan, and never twice.
    await ReputationLedger.award(ctx.getReputationRepository(), {
      userId: submission.userId,
      kind: "published",
      causeKey: reputationCause.submissionApproved(submission.id),
      at: now,
    });

    return { submission, created };
  }

  /** Rejects a locked PENDING submission and takes 10 points from the author. */
  private async rejectLocked(
    ctx: ISubmissionApprovalContext,
    submission: Submission,
    reviewerId: string | null,
    { reason, note }: SubmissionRejection,
    now: Date,
  ): Promise<Submission> {
    submission.reject(reviewerId, reason, note ?? null, now);
    if (!(await ctx.getSubmissionRepository().markReviewed(submission))) throw new SubmissionNotPendingError();
    await ReputationLedger.award(ctx.getReputationRepository(), {
      userId: submission.userId,
      kind: "rejected",
      causeKey: reputationCause.submissionRejected(submission.id),
      at: now,
    });
    return submission;
  }

  /**
   * The seeded "Comunidad" source. If an admin deleted it, approval still goes ahead without
   * a source rather than blocking moderation.
   */
  private async resolveCommunitySourceId(sourceRepository: ISourceRepository): Promise<string | null> {
    if (await sourceRepository.find(COMMUNITY_SOURCE_ID)) return COMMUNITY_SOURCE_ID;
    console.warn(`[submissions] community source ${COMMUNITY_SOURCE_ID} not found; approving without a source. Run the seed.`);
    return null;
  }
}
