import { Submission } from "@/domain/submissions/entities/Submission";
import {
  ISubmissionRepository,
  NewSubmission,
  SubmissionListFilters,
  SubmissionSortField,
} from "@/domain/submissions/repositories/ISubmissionRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaSubmissionMapper } from "../mappers/PrismaSubmissionMapper";

export default class PrismaSubmissionRepository implements ISubmissionRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async create({ userId, payload, uploadIds }: NewSubmission): Promise<Submission> {
    try {
      const row = await this.client.submission.create({
        data: {
          userId,
          type: payload.type,
          data: PrismaSubmissionMapper.payloadToJson(payload),
          status: "PENDING",
          uploads: { create: uploadIds.map((uploadId) => ({ uploadId })) },
        },
      });
      return PrismaSubmissionMapper.toDomain(row);
    } catch (error) {
      console.error("Error creating submission:", error);
      throw new DatabaseInsertError("Could not create submission", error);
    }
  }

  async find(id: string): Promise<Submission | null> {
    try {
      const row = await this.client.submission.findUnique({ where: { id } });
      return row ? PrismaSubmissionMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding submission:", error);
      throw new DatabaseError("Could not find submission", error);
    }
  }

  async findForUpdate(id: string): Promise<Submission | null> {
    try {
      // The locking read must come first: InnoDB takes the transaction's snapshot at its first
      // plain read, so the findUnique below sees whatever the previous lock holder committed.
      // Without it, MariaDB's snapshot isolation fails the later conditional UPDATE with
      // "Record has changed since last read" instead of matching zero rows.
      await this.client.$queryRaw`SELECT id FROM Submission WHERE id = ${id} FOR UPDATE`;
      const row = await this.client.submission.findUnique({ where: { id } });
      return row ? PrismaSubmissionMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error locking submission:", error);
      throw new DatabaseError("Could not find submission", error);
    }
  }

  async list(
    params: PaginationParams<SubmissionSortField>,
    filters: SubmissionListFilters = {},
  ): Promise<PaginatedResult<Submission>> {
    try {
      const where: Prisma.SubmissionWhereInput = {
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      };
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          // `id` breaks ties so pages are stable when several rows share a createdAt.
          findMany: (tx, page) =>
            tx.submission.findMany({
              where,
              skip: page.skip,
              take: page.take,
              orderBy: [page.orderBy ?? { createdAt: "desc" }, { id: "asc" }],
            }),
          count: (tx) => tx.submission.count({ where }),
        },
        PrismaSubmissionMapper.toDomain,
      );
    } catch (error) {
      console.error("Error listing submissions:", error);
      throw new DatabaseError("Could not list submissions", error);
    }
  }

  async markReviewed(submission: Submission): Promise<boolean> {
    try {
      // Conditional write: matches nothing if the row stopped being PENDING in the meantime.
      const { count } = await this.client.submission.updateMany({
        where: { id: submission.id, status: "PENDING" },
        data: {
          status: submission.status,
          reviewedById: submission.reviewedById,
          reviewedAt: submission.reviewedAt,
          reviewNote: submission.reviewNote,
        },
      });
      return count === 1;
    } catch (error) {
      console.error("Error reviewing submission:", error);
      throw new DatabaseInsertError("Could not review submission", error);
    }
  }

  async deletePendingOwned(id: string, userId: string): Promise<boolean> {
    try {
      const { count } = await this.client.submission.deleteMany({ where: { id, userId, status: "PENDING" } });
      return count === 1;
    } catch (error) {
      console.error("Error deleting submission:", error);
      throw new DatabaseInsertError("Could not delete submission", error);
    }
  }
}
