import { Submission } from "@/domain/submissions/entities/Submission";
import { SubmissionPayloadInput, normalizeSubmissionPayload } from "@/domain/submissions/entities/SubmissionPayload";
import { ISubmissionRepository, SubmissionSortField } from "@/domain/submissions/repositories/ISubmissionRepository";
import { ISubmissionApprovalUnitOfWork } from "@/domain/submissions/unitsOfWork/SubmissionApprovalUnitOfWork";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { ICategoryRepository } from "@/domain/categories/repositories/ICategoryRepository";
import { ISourceRepository } from "@/domain/sources/repositories/ISourceRepository";
import { COMMUNITY_SOURCE_ID } from "@/domain/sources/communitySource";
import { PaginatedResult, PaginationParams, SortDirection } from "@/domain/core/pagination/Pagination";
import { ISubmissionService, SubmissionApprovalResult, SubmissionQueueFilters } from "../interfaces/ISubmissionService";
import { ensureSubmissionReferencesExist } from "../submissionReferences";
import { SubmissionNotFoundError } from "../../errors/SubmissionNotFoundError";
import { SubmissionNotPendingError } from "../../errors/SubmissionNotPendingError";

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
    private readonly categoryRepository: ICategoryRepository,
    private readonly approvalUOW: ISubmissionApprovalUnitOfWork,
  ) {}

  async create(userId: string, input: SubmissionPayloadInput): Promise<Submission> {
    // Same domain rules as creating a Place/Event (400), then the same reference checks (422).
    const payload = normalizeSubmissionPayload(input);
    await ensureSubmissionReferencesExist(payload, {
      placeRepository: this.placeRepository,
      categoryRepository: this.categoryRepository,
    });
    return this.submissionRepository.create({ userId, payload });
  }

  async listMine(userId: string, params: Params): Promise<PaginatedResult<Submission>> {
    return this.submissionRepository.list(withDefaultSort(params, "desc"), { userId });
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
      const submissionRepository = ctx.getSubmissionRepository();
      const placeRepository = ctx.getPlaceRepository();

      // Locks the row: a concurrent approval waits here, then sees the committed status
      // and gets a clean 409 before creating anything.
      const submission = await submissionRepository.findForUpdate(id);
      if (!submission) throw new SubmissionNotFoundError();
      if (!submission.isPending()) throw new SubmissionNotPendingError();

      await ensureSubmissionReferencesExist(submission.payload, {
        placeRepository,
        categoryRepository: ctx.getCategoryRepository(),
      });

      const sourceId = await this.resolveCommunitySourceId(ctx.getSourceRepository());
      const now = new Date();
      const payload = submission.payload;
      let created: SubmissionApprovalResult["created"];

      if (payload.type === "PLACE") {
        // Repositories always insert as PENDING; publishing goes through the entity so
        // `verifiedAt` is set exactly as in PATCH /places/:id/status.
        const place = await placeRepository.create({ ...payload.data, sourceId });
        place.changeStatus("PUBLISHED", now);
        await placeRepository.update(place);
        created = { type: "PLACE", id: place.id };
      } else {
        const eventRepository = ctx.getEventRepository();
        const event = await eventRepository.create({ ...payload.data, sourceId });
        event.changeStatus("PUBLISHED");
        await eventRepository.update(event);
        created = { type: "EVENT", id: event.id };
      }

      submission.approve(reviewerId, now);
      // Second guard (the row lock is the first): only succeeds if the row is still PENDING;
      // otherwise this throws and the transaction rolls back the Place/Event created above.
      if (!(await submissionRepository.markReviewed(submission))) throw new SubmissionNotPendingError();

      return { submission, created };
    });
  }

  async reject(id: string, reviewerId: string, reason: string): Promise<Submission> {
    const submission = await this.get(id);
    if (!submission.isPending()) throw new SubmissionNotPendingError();
    submission.reject(reviewerId, reason, new Date());
    if (!(await this.submissionRepository.markReviewed(submission))) throw new SubmissionNotPendingError();
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
