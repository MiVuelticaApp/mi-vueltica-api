import { Request, Response } from "express";
import { getAuthUser } from "@/presentation/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/core/mappers/Pagination.mapper";
import UserDtoMapper from "../mappers/User.mapper";
import { ListUsersRequest } from "../requests/ListUsersRequest";
import { ChangeUserRoleRequest } from "../requests/ChangeUserRoleRequest";
import { IAdminUserService } from "@/application/users/services/interfaces/IAdminUserService";
import { IAccountDeletionExternalCleanup } from "@/application/users/services/interfaces/IAccountDeletionExternalCleanup";

export default class AdminUsersController {

  constructor(
    private readonly adminUserService: IAdminUserService,
    private readonly accountDeletionExternalCleanup: IAccountDeletionExternalCleanup,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = getValidated<ListUsersRequest>(req, "query");
    const result = await this.adminUserService.list(toPaginationParams(query), {
      role: query.role,
      search: query.search,
    });
    res.json(toPaginatedResponse(result, UserDtoMapper.toResponse));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<{ id: string }>(req, "params");
    const user = await this.adminUserService.findActive(id);
    res.json(UserDtoMapper.toResponse(user));
  }

  async changeRole(req: Request, res: Response): Promise<void> {
    const actor = getAuthUser(req);
    const { id } = getValidated<{ id: string }>(req, "params");
    const { role }: ChangeUserRoleRequest = req.body;
    const user = await this.adminUserService.changeRole(actor.id, id, role);
    console.log(`[admin-user-role] actorId=${actor.id} targetId=${id} role=${role}`);
    res.json(UserDtoMapper.toResponse(user));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const actor = getAuthUser(req);
    const { id } = getValidated<{ id: string }>(req, "params");

    const result = await this.adminUserService.deleteUser(actor.id, id);

    // Audit trail for a destructive action: ids only, never email or tokens.
    console.log(`[admin-user-deletion] actorId=${actor.id} targetId=${id}`);

    // Same best-effort cleanup as self-deletion (no Apple authorization code available).
    try {
      await this.accountDeletionExternalCleanup.run({ result });
    } catch (error) {
      console.error("Account deletion external cleanup failed:", error);
    }

    res.status(204).send();
  }
}
