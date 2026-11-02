import z from "zod";
import { cantonNameField } from "./createCanton";

// The id (INEC code, which encodes the province) is immutable: only the name can be replaced.
export const UpdateCantonSchema = z.object({
  name: cantonNameField,
});
