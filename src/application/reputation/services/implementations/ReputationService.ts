import { IReputationRepository } from "@/domain/reputation/repositories/IReputationRepository";
import { IUserRepository } from "@/domain/users/repositories/IUserRepository";
import { levelProgress, perksOf } from "@/domain/reputation/reputationRules";
import { UserNotFoundError } from "@/application/users/errors/UserNotFoundError";
import { IReputationService, ReputationSummary } from "../interfaces/IReputationService";

export const RECENT_REPUTATION_EVENTS = 20;

export class ReputationService implements IReputationService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly reputationRepository: IReputationRepository,
  ) {}

  async summary(userId: string): Promise<ReputationSummary> {
    const user = await this.userRepository.find(userId, "id");
    if (!user) throw new UserNotFoundError();
    const points = user.reputationPoints;
    const progress = levelProgress(points);
    return {
      points,
      ...progress,
      perks: perksOf(progress.level),
      recent: await this.reputationRepository.recent(userId, RECENT_REPUTATION_EVENTS),
    };
  }
}
