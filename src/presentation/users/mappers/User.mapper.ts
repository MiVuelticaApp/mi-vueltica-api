import { User } from "@/domain/users/entities/User";
import { UserResponse } from "../responses/UserResponse";
import { MyProfileResponse } from "../responses/MyProfileResponse";

export default class UserDtoMapper {
  static toResponse(user: User): UserResponse{
    return {
      id: user.id,
      name: user.name,
      surnames: user.surnames,
      email: user.email.value,
      ageRange: user.ageRange,
      role: user.role,
    };
  }

  static toMyProfileResponse(user: User): MyProfileResponse {
    return {
      ...this.toResponse(user),
    };
  }

}
