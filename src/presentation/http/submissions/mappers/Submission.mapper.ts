import { Submission } from "@/domain/submissions/entities/Submission";
import { SubmissionApprovalResult } from "@/application/submissions/services/interfaces/ISubmissionService";
import {
  ApproveSubmissionResponse,
  ModerationSubmissionResponse,
  SubmissionResponse,
} from "../responses/SubmissionResponse";

export default class SubmissionDtoMapper {
  static toResponse(submission: Submission): SubmissionResponse {
    return {
      id: submission.id,
      userId: submission.userId,
      type: submission.type,
      data: SubmissionDtoMapper.dataToResponse(submission),
      status: submission.status,
      reviewedAt: submission.reviewedAt ? submission.reviewedAt.toISOString() : null,
      rejectionReason: submission.rejectionReason,
      reviewNote: submission.reviewNote,
      rejectionMessage: submission.rejectionMessage,
      created: submission.created ? { ...submission.created } : null,
      createdAt: submission.createdAt.toISOString(),
    };
  }

  static toModerationResponse(submission: Submission): ModerationSubmissionResponse {
    return {
      ...SubmissionDtoMapper.toResponse(submission),
      reviewedById: submission.reviewedById,
      aiScore: submission.aiScore,
      aiReason: submission.aiReason,
    };
  }

  static toApprovalResponse(result: SubmissionApprovalResult): ApproveSubmissionResponse {
    return {
      submission: SubmissionDtoMapper.toModerationResponse(result.submission),
      created: result.created,
    };
  }

  private static dataToResponse(submission: Submission): Record<string, unknown> {
    const payload = submission.payload;
    if (payload.type === "EVENT") {
      return {
        ...payload.data,
        startsAt: payload.data.startsAt.toISOString(),
        endsAt: payload.data.endsAt ? payload.data.endsAt.toISOString() : null,
      };
    }
    return { ...payload.data };
  }
}
