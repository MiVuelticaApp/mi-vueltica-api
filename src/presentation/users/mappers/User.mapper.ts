import { User } from "@/domain/users/entities/User";
import { UserResponse } from "../responses/UserResponse";
import { MyProfileResponse } from "../responses/MyProfileResponse";
import { Category } from "@/domain/categories/entities/Category";
import CategoryDtoMapper from "@/presentation/categories/mappers/Category.mapper";

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

  static toMyProfileResponse(user: User, interests: Category[]): MyProfileResponse {
    return {
      ...this.toResponse(user),
      interests: interests.map(CategoryDtoMapper.toResponse),
    };
  }

}
