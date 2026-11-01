import { IUserDeletionUnitOfWork } from "@/domain/users/unitsOfWork/UserDeletionUnitOfWork";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { AccountDeletionResult, IAccountDeletionService } from "../interfaces/IAccountDeletionService";

export class AccountDeletionService implements IAccountDeletionService {
  constructor(
    private readonly userDeletionUOW: IUserDeletionUnitOfWork,
  ) {}

  async deleteAccount(userId: string): Promise<AccountDeletionResult> {
    return this.userDeletionUOW.runInTransaction(async (ctx) => {
      const userRepo       = ctx.getUserRepository();

      const user = await userRepo.find(userId, "id");
      if (!user) throw new UserNotFoundError();

      const email = user.email.value;
      const name  = `${user.name} ${user.surnames}`.trim();

      // Hard delete: every relation to User cascades (or is set null) at the DB level.
      await userRepo.delete(userId);

      return { email, name };
    });
  }
}