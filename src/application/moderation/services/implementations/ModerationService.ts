import { ISubmissionRepository } from "@/domain/submissions/repositories/ISubmissionRepository";
import { IReportRepository } from "@/domain/community/repositories/ICommunityRepositories";
import { IModerationVoteRepository } from "@/domain/moderation/repositories/IModerationVoteRepository";
import { IReputationRepository } from "@/domain/reputation/repositories/IReputationRepository";
import { IUserRepository } from "@/domain/users/repositories/IUserRepository";
import { ModerationTarget, moderationTargetKey } from "@/domain/moderation/entities/ModerationVote";
import {
  MODERATION_QUEUE_LIMIT,
  REPORTED_VOTES_NEEDED,
  canModerate,
  votesNeededForSubmission,
} from "@/domain/moderation/moderationRules";
import { ForbiddenError } from "@/application/core/errors/ForbiddenError";
import { UnauthorizedError } from "@/application/core/errors/UnauthorizedError";
import { MODERATION_LEVEL_ERROR, Voter } from "../moderationVoting";
import { IModerationService, ModerationQueue } from "../interfaces/IModerationService";

const NO_VOTES = { votesFor: 0, votesAgainst: 0, myVote: null };

export class ModerationService implements IModerationService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly submissionRepository: ISubmissionRepository,
    private readonly reportRepository: IReportRepository,
    private readonly voteRepository: IModerationVoteRepository,
    private readonly reputationRepository: IReputationRepository,
  ) {}

  async queue(voter: Voter): Promise<ModerationQueue> {
    const user = await this.userRepository.find(voter.id, "id");
    if (!user) throw new UnauthorizedError();
    if (!canModerate(user.role, user.reputationPoints)) throw new ForbiddenError(MODERATION_LEVEL_ERROR);

    const page = { page: 1, pageSize: MODERATION_QUEUE_LIMIT };
    const [submissions, reported] = await Promise.all([
      this.submissionRepository.list(
        { ...page, sort: { field: "createdAt", direction: "asc" } },
        { status: "PENDING", excludeUserId: voter.id },
      ),
      this.reportRepository.queue(page, new Date(), { excludeAuthorId: voter.id }),
    ]);

    const targets: ModerationTarget[] = [
      ...submissions.items.map((s): ModerationTarget => ({ type: "SUBMISSION", id: s.id })),
      ...reported.items.map((r): ModerationTarget => r.target),
    ];
    const [tallies, authorPoints] = await Promise.all([
      this.voteRepository.tallies(targets, voter.id),
      this.reputationRepository.pointsOf([...new Set(submissions.items.map((s) => s.userId))]),
    ]);
    const tallyOf = (target: ModerationTarget) => tallies.get(moderationTargetKey(target)) ?? NO_VOTES;

    return {
      nuevas: submissions.items.map((submission) => ({
        submission,
        ...tallyOf({ type: "SUBMISSION", id: submission.id }),
        votesNeeded: votesNeededForSubmission(authorPoints.get(submission.userId) ?? 0),
      })),
      reportadas: reported.items.map((report) => ({
        report,
        ...tallyOf(report.target),
        votesNeeded: REPORTED_VOTES_NEEDED,
      })),
      totals: { nuevas: submissions.total, reportadas: reported.total },
    };
  }
}
