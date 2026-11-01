import z from "zod";
import { contentStatusField } from "@/presentation/http/places/validators/changePlaceStatus";

export const ChangeEventStatusSchema = z.object({
  status: contentStatusField,
});
