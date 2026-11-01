import { Request, Response } from "express";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { IUserInterestService } from "@/application/users/services/interfaces/IUserInterestService";
import CategoryDtoMapper from "@/presentation/http/categories/mappers/Category.mapper";
import UpdateInterestsRequest from "../requests/UpdateInterestsRequest";

export default class MyInterestsController {

  constructor(private readonly userInterestService: IUserInterestService) {}

  async list(req: Request, res: Response): Promise<void> {
    const { id } = getAuthUser(req);
    const categories = await this.userInterestService.list(id);
    res.json(categories.map(CategoryDtoMapper.toResponse));
  }

  async replace(req: Request, res: Response): Promise<void> {
    const { id } = getAuthUser(req);
    const { categoryIds }: UpdateInterestsRequest = req.body;
    const categories = await this.userInterestService.replace(id, categoryIds);
    res.json(categories.map(CategoryDtoMapper.toResponse));
  }
}
