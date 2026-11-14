import { Request, Response } from "express";
import { z } from "zod";
import { IBlockService } from "@/application/blocks/services/interfaces/IBlockService";
import { IReviewService } from "@/application/reviews/services/interfaces/IReviewService";
import { UnauthorizedError } from "@/application/core/errors/UnauthorizedError";
import { ReviewTarget, ReviewTargetType } from "@/domain/reviews/valueObjects/reviewTarget.valueObject";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import {
  ListReviewQueueQuerySchema,
  ListReviewsQuerySchema,
  ListTargetReviewsQuerySchema,
} from "../validators/listReviews";
import { ReviewRequest } from "../requests/ReviewRequest";
import { ChangeReviewStatusRequest } from "../requests/ChangeReviewStatusRequest";
import { ReportReviewRequest } from "../validators/reportReview";
import { TargetReviewListResponse } from "../responses/ReviewResponse";
import ReviewDtoMapper from "../mappers/Review.mapper";
import RatingSummaryDtoMapper from "../mappers/RatingSummary.mapper";

type ListQuery = z.output<typeof ListReviewsQuerySchema>;
type TargetListQuery = z.output<typeof ListTargetReviewsQuerySchema>;
type QueueQuery = z.output<typeof ListReviewQueueQuerySchema>;
type IdParams = { id: string };
type Handler = (req: Request, res: Response) => Promise<void>;

/** Path param holding the place / event id for each kind of review list. */
export const REVIEW_TARGET_PARAMS: Record<ReviewTargetType, string> = { PLACE: "placeId", EVENT: "eventId" };

/** MODERATOR / ADMIN (set by `optionalJwtAuth` / `requireRole` from the database). */
function isPrivileged(req: Request): boolean {
  const role = req.user?.role;
  return role === "MODERATOR" || role === "ADMIN";
}

function reviewBody(req: Request): ReviewRequest {
  const { rating, comment, wentWith, spent, photos }: ReviewRequest = req.body;
  return { rating, comment, wentWith, spent, photos };
}

export default class ReviewController {
  constructor(
    private readonly reviewService: IReviewService,
    private readonly blockService: IBlockService,
  ) {}

  /** List / create handlers of `/places/:placeId/reviews` or `/events/:eventId/reviews`. */
  target(type: ReviewTargetType): { list: Handler; create: Handler } {
    const targetOf = (req: Request): ReviewTarget => ({
      type,
      id: getValidated<Record<string, string>>(req, "params")[REVIEW_TARGET_PARAMS[type]],
    });

    return {
      // Public: PUBLISHED reviews, plus the caller's own PENDING one, plus the rating summary.
      list: async (req: Request, res: Response) => {
        const query = getValidated<TargetListQuery>(req, "query");
        const { page, summary } = await this.reviewService.listForTarget(targetOf(req), toPaginationParams(query), {
          viewerId: req.user?.id,
          canSeeUnpublishedTarget: isPrivileged(req),
          audience: query.audience,
          withPhotos: query.withPhotos,
          // A signed-in viewer does not see the reviews of the people they blocked (#17).
          excludeUserIds: await this.blockService.blockedUserIds(req.user?.id),
        });
        const body: TargetReviewListResponse = {
          ...toPaginatedResponse(page, ReviewDtoMapper.toResponse),
          summary: RatingSummaryDtoMapper.toResponse(summary),
        };
        res.json(body);
      },
      create: async (req: Request, res: Response) => {
        const { id: userId } = getAuthUser(req);
        const review = await this.reviewService.create(userId, targetOf(req), reviewBody(req));
        res.status(201).json(ReviewDtoMapper.toResponse(review));
      },
    };
  }

  /** GET /me/reviews */
  async listMine(req: Request, res: Response): Promise<void> {
    const { id } = getAuthUser(req);
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.reviewService.listMine(id, toPaginationParams(query));
    res.json(toPaginatedResponse(result, ReviewDtoMapper.toResponse));
  }

  /** GET /reviews — moderation queue. */
  async list(req: Request, res: Response): Promise<void> {
    const query = getValidated<QueueQuery>(req, "query");
    const result = await this.reviewService.list(
      toPaginationParams(query),
      { statuses: [query.status], placeId: query.placeId, eventId: query.eventId },
      req.user?.id,
    );
    res.json(toPaginatedResponse(result, ReviewDtoMapper.toResponse));
  }

  /** PUT /reviews/:id — owner only. */
  async update(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    const review = await this.reviewService.update(userId, id, reviewBody(req));
    res.json(ReviewDtoMapper.toResponse(review));
  }

  /** DELETE /reviews/:id — owner, MODERATOR or ADMIN. */
  async delete(req: Request, res: Response): Promise<void> {
    const { id: userId, role } = getAuthUser(req);
    // `requireRole` runs before this handler and always sets the role.
    if (!role) throw new UnauthorizedError();
    const { id } = getValidated<IdParams>(req, "params");
    await this.reviewService.delete({ id: userId, role }, id);
    res.status(204).send();
  }

  /** PATCH /reviews/:id/status — MODERATOR, ADMIN. */
  async changeStatus(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const { status }: ChangeReviewStatusRequest = req.body;
    const review = await this.reviewService.changeStatus(id, status, req.user?.id);
    res.json(ReviewDtoMapper.toResponse(review));
  }

  /** POST /reviews/:id/reports — any signed-in user except the author; 201 `{ hidden }`. */
  async report(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    const { reason, details }: ReportReviewRequest = req.body;
    const result = await this.reviewService.report(userId, id, { reason, details: details || null });
    res.status(201).json(result);
  }

  /** POST /reviews/:id/useful — idempotent "útil" vote. */
  async markUseful(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    const review = await this.reviewService.markUseful(userId, id);
    res.json(ReviewDtoMapper.toResponse(review));
  }

  /** DELETE /reviews/:id/useful — idempotent. */
  async unmarkUseful(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    const review = await this.reviewService.unmarkUseful(userId, id);
    res.json(ReviewDtoMapper.toResponse(review));
  }
}
