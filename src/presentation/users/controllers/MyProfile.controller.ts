import { Request, Response } from "express";
import { UpdateUserRequest } from "../requests/UpdateUserRequest";
import UserDtoMapper from "../mappers/User.mapper";
import { IUserService } from "@/application/users/services/interfaces/IUserService";
import { IAccountDeletionService } from "@/application/users/services/interfaces/IAccountDeletionService";
import { IAccountDeletionExternalCleanup } from "@/application/users/services/interfaces/IAccountDeletionExternalCleanup";

export default class MyProfileController {

  constructor(
    private readonly userService: IUserService,
    private readonly accountDeletionService: IAccountDeletionService,
    private readonly accountDeletionExternalCleanup: IAccountDeletionExternalCleanup,
  ) {}

  async update(req: Request, res: Response): Promise<void> {
    // @ts-expect-error 
    const { id } = req.user;
    const { body } = req;
    const data: UpdateUserRequest = {
      id,
      ...body
    }
    await this.userService.update(UserDtoMapper.fromUpdateRequestToEntity(data));
    const updatedUser = await this.userService.find(id);
    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(UserDtoMapper.toResponse(updatedUser));
  }

  async me(req: Request, res: Response): Promise<void> {
    // @ts-expect-error
    const { id } = req.user;
    const user = await this.userService.find(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(UserDtoMapper.toMyProfileResponse(user));
  }

  async logout(req: Request, res: Response) {
    // Invalidate user session or token here if applicable
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  }

  async deleteAccount(req: Request, res: Response): Promise<void> {
    const { appleAuthCode } = req.body ?? {};
    // @ts-expect-error
    const { id } = req.user;

    const result = await this.accountDeletionService.deleteAccount(id);

    // Audit trail for a destructive action: userId + counts only.
    // Never log the email, the appleAuthorizationCode, or any tokens.
    console.log(
      `[account-deletion] userId=${id} deletedCompanies=${result.deletedCompanyIds.length} unlinkedCompanies=${result.unlinkedCompanyIds.length}`,
    );

    // Best-effort external cleanup (Apple revoke, RevenueCat subscriber deletion,
    // confirmation email). Each side effect is isolated inside `run`; the wrapper
    // here is a secondary guard so an unforeseen throw still never reaches the
    // client. The deletion has already committed and must not be reverted.
    try {
      await this.accountDeletionExternalCleanup.run({ result, appleAuthorizationCode: appleAuthCode });
    } catch (error) {
      console.error("Account deletion external cleanup failed:", error);
    }

    res.status(204).send();
  }
}