import { Report, ReportQueueItem } from "@/domain/community/entities/Report";
import { VerificationSummary } from "@/domain/community/entities/Verification";
import { PlanTarget } from "@/domain/community/valueObjects/planTarget.valueObject";
import { ReportDecision } from "@/domain/community/rules/reportRules";
import { ReportDecisionResult } from "@/application/community/services/interfaces/ICommunityService";
import {
  ReportDecisionResponse,
  ReportQueueItemResponse,
  ReportResponse,
  VerificationFieldsResponse,
} from "../responses/CommunityResponses";

const targetIds = (target: PlanTarget) => ({
  placeId: target.type === "PLACE" ? target.id : null,
  eventId: target.type === "EVENT" ? target.id : null,
});

export default class CommunityDtoMapper {
  static toReportResponse(report: Report): ReportResponse {
    return {
      id: report.id,
      ...targetIds(report.target),
      reason: report.reason,
      details: report.details,
      photo: report.photo,
      createdAt: report.createdAt.toISOString(),
    };
  }

  static toQueueItemResponse(item: ReportQueueItem): ReportQueueItemResponse {
    return {
      type: item.target.type,
      ...targetIds(item.target),
      title: item.title,
      status: item.status,
      hiddenReason: item.hiddenReason,
      reportedAt: item.reportedAt ? item.reportedAt.toISOString() : null,
      needsReview: item.needsReview,
      reportCount: item.reportCount,
      topReason: item.topReason,
      reasons: { ...item.reasons },
      firstReportAt: item.firstReportAt.toISOString(),
      lastReportAt: item.lastReportAt.toISOString(),
      reports: item.reports.map(CommunityDtoMapper.toReportResponse),
    };
  }

  static toDecisionResponse(result: ReportDecisionResult, decision: ReportDecision): ReportDecisionResponse {
    return {
      ...targetIds(result.target),
      decision,
      status: result.status,
      hiddenReason: result.hiddenReason,
      resolvedReports: result.resolvedReports,
    };
  }

  static toVerificationFields(summary: VerificationSummary): VerificationFieldsResponse {
    return {
      lastVerifiedAt: summary.lastVerifiedAt ? summary.lastVerifiedAt.toISOString() : null,
      verificationCount: summary.verificationCount,
      myVerifiedToday: summary.myVerifiedToday,
    };
  }
}
