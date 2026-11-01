import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { User, UserRole } from "@/domain/users/entities/User";
import { IUserRepository, UserListFilters } from "@/domain/users/repositories/IUserRepository";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { SelfModificationError } from "../../errors/SelfModificationError";
import { IAdminUserService } from "../interfaces/IAdminUserService";
import { AccountDeletionResult, IAccountDeletionService } from "../interfaces/IAccountDeletionService";

export class AdminUserService implements IAdminUserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly accountDeletionService: IAccountDeletionService,
  ) {}

  async list(params: PaginationParams, filters: UserListFilters): Promise<PaginatedResult<User>> {
    return this.userRepository.list(params, filters);
  }

  async findActive(id: string): Promise<User> {
    const user = await this.userRepository.find(id, "id");
    if (!user || user.deletedAt) throw new UserNotFoundError();
    return user;
  }

  async changeRole(actorId: string, targetId: string, role: UserRole): Promise<User> {
    if (actorId === targetId) throw new SelfModificationError();

    const user = await this.findActive(targetId);
    user.changeRole(role);
    await this.userRepository.update(user);

    return this.findActive(targetId);
  }

  async deleteUser(actorId: string, targetId: string): Promise<AccountDeletionResult> {
    if (actorId === targetId) throw new SelfModificationError();

    await this.findActive(targetId);
    return this.accountDeletionService.deleteAccount(targetId);
  }
}
