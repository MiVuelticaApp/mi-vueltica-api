import { CreateReportData, IReportRepository } from "@/domain/community/repositories/ICommunityRepositories";
import { Report, ReportQueueItem } from "@/domain/community/entities/Report";
import { PlanTarget } from "@/domain/community/valueObjects/planTarget.valueObject";
import { ReportReason } from "@/domain/community/valueObjects/reportReason.valueObject";
import { NEEDS_REVIEW_HOURS, needsReview, reportsHide } from "@/domain/community/rules/reportRules";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma, Report as PrismaReport } from "@/infrastructure/prisma/generated/prisma/client";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { reportReasonFromDb, reportReasonToDb, targetColumns, targetOfRow } from "../mappers/communityEnums";

function toReport(row: PrismaReport): Report {
  return {
    id: row.id,
    target: targetOfRow(row),
    reason: reportReasonFromDb(row.reason),
    details: row.details,
    photo: row.photoUrl,
    createdAt: row.createdAt,
  };
}

interface QueueRow {
  placeId: string | null;
  eventId: string | null;
}

export default class PrismaReportRepository implements IReportRepository {
  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async existsForPerson(target: PlanTarget, personKey: string): Promise<boolean> {
    try {
      return (await this.client.report.count({ where: { ...targetColumns(target), personKey } })) > 0;
    } catch (error) {
      console.error("Error checking report:", error);
      throw new DatabaseError("Could not check report", error);
    }
  }

  async create(data: CreateReportData): Promise<Report> {
    try {
      const row = await this.client.report.create({
        data: {
          ...targetColumns(data.target),
          userId: data.userId,
          personKey: data.personKey,
          reason: reportReasonToDb(data.reason),
          details: data.details,
          uploadId: data.photo?.uploadId ?? null,
          photoUrl: data.photo?.url ?? null,
        },
      });
      return toReport(row);
    } catch (error) {
      console.error("Error creating report:", error);
      throw new DatabaseInsertError("Could not create report", error);
    }
  }

  async unresolvedReasons(target: PlanTarget): Promise<ReportReason[]> {
    try {
      const rows = await this.client.report.findMany({
        where: { ...targetColumns(target), resolvedAt: null },
        select: { reason: true },
      });
      return rows.map((row) => reportReasonFromDb(row.reason));
    } catch (error) {
      console.error("Error listing reports:", error);
      throw new DatabaseError("Could not list reports", error);
    }
  }

  async resolveAll(target: PlanTarget, at: Date): Promise<number> {
    try {
      const { count } = await this.client.report.updateMany({
        where: { ...targetColumns(target), resolvedAt: null },
        data: { resolvedAt: at },
      });
      return count;
    } catch (error) {
      console.error("Error resolving reports:", error);
      throw new DatabaseInsertError("Could not resolve reports", error);
    }
  }

  async queue(params: PaginationParams, now: Date): Promise<PaginatedResult<ReportQueueItem>> {
    const take = params.pageSize;
    const skip = (params.page - 1) * params.pageSize;
    const reviewCutoff = new Date(now.getTime() - NEEDS_REVIEW_HOURS * 60 * 60 * 1000);
    try {
      // One row per reported plan. Order: needs review, then hidden by reports, then oldest report first.
      // Full expressions (not aliases) in ORDER BY so MySQL's ONLY_FULL_GROUP_BY and MariaDB agree.
      const [targets, totals] = await Promise.all([
        this.client.$queryRaw<QueueRow[]>`
          SELECT r.placeId, r.eventId
          FROM Report r
          LEFT JOIN Place p ON p.id = r.placeId
          LEFT JOIN Event e ON e.id = r.eventId
          WHERE r.resolvedAt IS NULL
          GROUP BY r.placeId, r.eventId, p.reportedAt, e.reportedAt
          ORDER BY
            (COALESCE(p.reportedAt, e.reportedAt) IS NOT NULL AND COALESCE(p.reportedAt, e.reportedAt) < ${reviewCutoff}) DESC,
            (COALESCE(p.reportedAt, e.reportedAt) IS NOT NULL) DESC,
            MIN(r.createdAt) ASC,
            r.placeId ASC,
            r.eventId ASC
          LIMIT ${take} OFFSET ${skip}
        `,
        this.client.$queryRaw<{ total: bigint | number }[]>`
          SELECT COUNT(*) AS total FROM (
            SELECT 1 AS one FROM Report WHERE resolvedAt IS NULL GROUP BY placeId, eventId
          ) AS reported
        `,
      ]);
      const total = Number(totals[0]?.total ?? 0);
      const placeIds = targets.flatMap((t) => (t.placeId ? [t.placeId] : []));
      const eventIds = targets.flatMap((t) => (t.eventId ? [t.eventId] : []));

      const [reports, places, events] = await Promise.all([
        this.client.report.findMany({
          where: {
            resolvedAt: null,
            OR: [{ placeId: { in: placeIds } }, { eventId: { in: eventIds } }],
          },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        }),
        this.client.place.findMany({
          where: { id: { in: placeIds } },
          select: { id: true, name: true, status: true, hiddenReason: true, reportedAt: true },
        }),
        this.client.event.findMany({
          where: { id: { in: eventIds } },
          select: { id: true, title: true, status: true, hiddenReason: true, reportedAt: true },
        }),
      ]);
      const plans = new Map<string, { title: string; status: ReportQueueItem["status"]; hiddenReason: string | null; reportedAt: Date | null }>([
        ...places.map((p) => [`PLACE:${p.id}`, { title: p.name, status: p.status, hiddenReason: p.hiddenReason, reportedAt: p.reportedAt }] as const),
        ...events.map((e) => [`EVENT:${e.id}`, { title: e.title, status: e.status, hiddenReason: e.hiddenReason, reportedAt: e.reportedAt }] as const),
      ]);

      const items: ReportQueueItem[] = [];
      for (const row of targets) {
        const target = targetOfRow(row);
        const key = `${target.type}:${target.id}`;
        const plan = plans.get(key);
        const own = reports.filter((r) => (target.type === "PLACE" ? r.placeId === target.id : r.eventId === target.id)).map(toReport);
        // Deleted between the two queries: skip it rather than fail the page.
        if (!plan || own.length === 0) continue;
        const reasons: ReportQueueItem["reasons"] = {};
        for (const r of own) reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
        const { topReason } = reportsHide(own.map((r) => r.reason));
        items.push({
          target,
          title: plan.title,
          status: plan.status,
          hiddenReason: plan.hiddenReason,
          reportedAt: plan.reportedAt,
          reportCount: own.length,
          topReason,
          reasons,
          firstReportAt: own[own.length - 1].createdAt,
          lastReportAt: own[0].createdAt,
          needsReview: needsReview(plan.reportedAt, now),
          reports: own,
        });
      }
      return { items, page: params.page, pageSize: params.pageSize, total };
    } catch (error) {
      console.error("Error listing the report queue:", error);
      throw new DatabaseError("Could not list the report queue", error);
    }
  }
}
