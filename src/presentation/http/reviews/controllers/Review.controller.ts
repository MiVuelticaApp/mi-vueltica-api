import { Request, Response } from "express";
import { z } from "zod";
import { IReviewService } from "@/application/reviews/services/interfaces/IReviewService";
import { UnauthorizedError } from "@/application/core/errors/UnauthorizedError";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListReviewQueueQuerySchema, ListReviewsQuerySchema } from "../validators/listReviews";
import { ReviewRequest } from "../requests/ReviewRequest";
import { ChangeReviewStatusRequest } from "../requests/ChangeReviewStatusRequest";
import ReviewDtoMapper from "../mappers/Review.mapper";

type ListQuery = z.output<typeof ListReviewsQuerySchema>;
type QueueQuery = z.output<typeof ListReviewQueueQuerySchema>;
type PlaceParams = { placeId: string };
type IdParams = { id: string };

/** MODERATOR / ADMIN (set by `optionalJwtAuth` / `requireRole` from the database). */
function isPrivileged(req: Request): boolean {
  const role = req.user?.role;
  return role === "MODERATOR" || role === "ADMIN";
}

export default class ReviewController {
  constructor(private readonly reviewService: IReviewService) {}

  /** GET /places/:placeId/reviews — public, PUBLISHED reviews only. */
  async listForPlace(req: Request, res: Response): Promise<void> {
    const { placeId } = getValidated<PlaceParams>(req, "params");
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.reviewService.listForPlace(placeId, toPaginationParams(query), {
      canSeeUnpublishedPlace: isPrivileged(req),
    });
    res.json(toPaginatedResponse(result, ReviewDtoMapper.toResponse));
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
    const result = await this.reviewService.list(toPaginationParams(query), {
      statuses: [query.status],
      placeId: query.placeId,
    });
    res.json(toPaginatedResponse(result, ReviewDtoMapper.toResponse));
  }

  /** POST /places/:placeId/reviews */
  async create(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { placeId } = getValidated<PlaceParams>(req, "params");
    const { rating, comment }: ReviewRequest = req.body;
    const review = await this.reviewService.create(userId, placeId, { rating, comment });
    res.status(201).json(ReviewDtoMapper.toResponse(review));
  }

  /** PUT /reviews/:id — owner only. */
  async update(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    const { rating, comment }: ReviewRequest = req.body;
    const review = await this.reviewService.update(userId, id, { rating, comment });
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
    const review = await this.reviewService.changeStatus(id, status);
    res.json(ReviewDtoMapper.toResponse(review));
  }
}
