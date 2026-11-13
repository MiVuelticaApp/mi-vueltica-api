import { User } from "@/domain/users/entities/User";
import { UserResponse } from "../responses/UserResponse";
import { MyProfileResponse } from "../responses/MyProfileResponse";
import { Category } from "@/domain/categories/entities/Category";
import CategoryDtoMapper from "@/presentation/http/categories/mappers/Category.mapper";
import { UserActivityCounts } from "@/domain/users/repositories/IUserRepository";
import { levelFor } from "@/domain/reputation/reputationRules";
import { ReputationSummary } from "@/application/reputation/services/interfaces/IReputationService";
import { ReputationResponse } from "../responses/ReputationResponse";

export default class UserDtoMapper {
  static toResponse(user: User): UserResponse{
    return {
      id: user.id,
      name: user.name,
      surnames: user.surnames,
      email: user.email.value,
      ageRange: user.ageRange,
      role: user.role,
      province: user.province,
      createdAt: user.createdAt.toISOString(),
      points: user.reputationPoints,
      level: levelFor(user.reputationPoints),
    };
  }

  static toMyProfileResponse(user: User, interests: Category[], counts: UserActivityCounts): MyProfileResponse {
    return {
      ...this.toResponse(user),
      interests: interests.map(CategoryDtoMapper.toResponse),
      counts,
    };
  }

  static toReputationResponse(summary: ReputationSummary): ReputationResponse {
    return {
      points: summary.points,
      level: summary.level,
      nextLevel: summary.nextLevel,
      pointsToNext: summary.pointsToNext,
      progress: summary.progress,
      perks: summary.perks,
      recent: summary.recent.map((event) => ({
        kind: event.kind,
        delta: event.delta,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }

}
