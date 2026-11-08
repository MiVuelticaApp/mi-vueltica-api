import { ICommunityContext, ICommunityUnitOfWork } from "@/domain/community/unitsOfWork/CommunityUnitOfWork";
import { prisma } from "@/infrastructure/prisma/client";
import PrismaPlanStateRepository from "../repositories/PrismaPlanStateRepository";
import PrismaVerificationRepository from "../repositories/PrismaVerificationRepository";
import PrismaReportRepository from "../repositories/PrismaReportRepository";

/** Same pattern as PrismaSubmissionApprovalUnitOfWork: the repositories share the transaction client. */
export class PrismaCommunityUnitOfWork implements ICommunityUnitOfWork {
  async runInTransaction<T>(work: (context: ICommunityContext) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) =>
      work({
        getPlanStateRepository: () => new PrismaPlanStateRepository(tx),
        getVerificationRepository: () => new PrismaVerificationRepository(tx),
        getReportRepository: () => new PrismaReportRepository(tx),
      }),
    );
  }
}
