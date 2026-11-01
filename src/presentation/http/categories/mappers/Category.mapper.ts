import { Category } from "@/domain/categories/entities/Category";
import { CategoryResponse } from "../responses/CategoryResponse";

export default class CategoryDtoMapper {
  static toResponse(category: Category): CategoryResponse {
    return { id: category.id, name: category.name };
  }
}
