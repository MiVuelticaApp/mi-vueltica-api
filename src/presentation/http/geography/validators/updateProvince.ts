import z from "zod";
import { provinceNameField } from "./createProvince";

// The id (INEC code) is immutable: only the name can be replaced.
export const UpdateProvinceSchema = z.object({
  name: provinceNameField,
});
