import z from "zod";
import { CATEGORY_NAME_MAX_LENGTH } from "@/domain/categories/valueObjects/categoryName.valueObject";

export const categoryNameField = z
  .string({ error: "El nombre es requerido" })
  .trim()
  .min(1, { message: "El nombre es requerido" })
  .max(CATEGORY_NAME_MAX_LENGTH, { message: `El nombre no puede exceder ${CATEGORY_NAME_MAX_LENGTH} caracteres` });

export const CreateCategorySchema = z.object({
  name: categoryNameField,
});
