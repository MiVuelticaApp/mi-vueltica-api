import { Category } from "@/domain/categories/entities/Category";
import { ICategoryRepository } from "@/domain/categories/repositories/ICategoryRepository";
import { IUserRepository } from "@/domain/users/repositories/IUserRepository";
import { IUserInterestRepository } from "@/domain/users/repositories/IUserInterestRepository";
import { IUserInterestService } from "../interfaces/IUserInterestService";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { InvalidCategoryIdsError } from "../../errors/InvalidCategoryIdsError";

export class UserInterestService implements IUserInterestService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userInterestRepository: IUserInterestRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async list(userId: string): Promise<Category[]> {
    return this.userInterestRepository.listCategoriesByUser(userId);
  }

  async replace(userId: string, categoryIds: number[]): Promise<Category[]> {
    const user = await this.userRepository.find(userId, "id");
    if (!user) throw new UserNotFoundError();

    const uniqueIds = [...new Set(categoryIds)];
    const found = await this.categoryRepository.findByIds(uniqueIds);
    const foundIds = new Set(found.map((category) => category.id));
    const missing = uniqueIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) throw new InvalidCategoryIdsError(missing);

    await this.userInterestRepository.replaceForUser(userId, uniqueIds);
    return this.userInterestRepository.listCategoriesByUser(userId);
  }
}
