import { ModerationTally, ModerationVoteResult } from "@/domain/moderation/entities/ModerationVote";
import { ModerationQueue } from "@/application/moderation/services/interfaces/IModerationService";
import SubmissionDtoMapper from "@/presentation/http/submissions/mappers/Submission.mapper";
import CommunityDtoMapper from "@/presentation/http/community/mappers/Community.mapper";
import { ModerationQueueResponse, ModerationTallyResponse, ModerationVoteResponse } from "../responses/ModerationResponses";

const toTally = (tally: ModerationTally): ModerationTallyResponse => ({
  votesFor: tally.votesFor,
  votesAgainst: tally.votesAgainst,
  votesNeeded: tally.votesNeeded,
  myVote: tally.myVote,
});

export default class ModerationDtoMapper {
  static toVoteResponse(result: ModerationVoteResult): ModerationVoteResponse {
    return { type: result.target.type, id: result.target.id, kind: result.kind, ...toTally(result), decision: result.decision };
  }

  static toQueueResponse(queue: ModerationQueue): ModerationQueueResponse {
    return {
      nuevas: queue.nuevas.map((item) => {
        // Voters do not see who suggested it.
        const { userId: _authorId, ...submission } = SubmissionDtoMapper.toResponse(item.submission);
        return { submission, ...toTally(item) };
      }),
      reportadas: queue.reportadas.map((item) => ({ report: CommunityDtoMapper.toQueueItemResponse(item.report), ...toTally(item) })),
      totals: queue.totals,
      total: queue.totals.nuevas + queue.totals.reportadas,
    };
  }
}
