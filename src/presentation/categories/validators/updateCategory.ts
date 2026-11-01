import z from "zod";
import { categoryNameField } from "./createCategory";

export const UpdateCategorySchema = z.object({
  name: categoryNameField,
});
