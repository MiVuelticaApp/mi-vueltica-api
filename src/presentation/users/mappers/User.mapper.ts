import { User } from "@/domain/users/entities/User";
import { UpdateUserRequest } from "../requests/UpdateUserRequest";
import { UserResponse } from "../responses/UserResponse";
import { MyProfileResponse } from "../responses/MyProfileResponse";

export default class UserDtoMapper {
  static fromUpdateRequestToEntity(request: UpdateUserRequest): User {
    return new User(
      {
        id: request.id,
        name: request.name || "",
        surnames: request.surnames || "",
        email:  "default@example.com", // no needed for update
        createdAt:  new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }

  static toResponse(user: User): UserResponse{
    return {
      id: user.id,
      name: user.name,
      surnames: user.surnames,
      email: user.email.value,
    };
  }

  static toMyProfileResponse(user: User): MyProfileResponse {
    return {
      ...this.toResponse(user),
    };
  }

}
