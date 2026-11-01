import { Request, Response } from "express";
import { z } from "zod";
import { ICategoryService } from "@/application/categories/services/interfaces/ICategoryService";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListCategoriesQuerySchema } from "../validators/listCategories";
import { CreateCategoryRequest } from "../requests/CreateCategoryRequest";
import { UpdateCategoryRequest } from "../requests/UpdateCategoryRequest";
import CategoryDtoMapper from "../mappers/Category.mapper";

type ListQuery = z.output<typeof ListCategoriesQuerySchema>;
type IdParams = { id: number };

export default class CategoryController {
  constructor(private readonly categoryService: ICategoryService) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.categoryService.list(toPaginationParams(query), { search: query.search || undefined });
    res.json(toPaginatedResponse(result, CategoryDtoMapper.toResponse));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const category = await this.categoryService.get(id);
    res.json(CategoryDtoMapper.toResponse(category));
  }

  async create(req: Request, res: Response): Promise<void> {
    const { name }: CreateCategoryRequest = req.body;
    const category = await this.categoryService.create(name);
    res.status(201).json(CategoryDtoMapper.toResponse(category));
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const { name }: UpdateCategoryRequest = req.body;
    const category = await this.categoryService.update(id, name);
    res.json(CategoryDtoMapper.toResponse(category));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    await this.categoryService.delete(id);
    res.status(204).send();
  }
}
