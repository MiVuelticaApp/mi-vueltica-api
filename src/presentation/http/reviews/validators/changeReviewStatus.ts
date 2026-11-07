import z from "zod";
import { contentStatusField } from "@/presentation/http/places/validators/changePlaceStatus";

export const ChangeReviewStatusSchema = z.object({
  status: contentStatusField,
});
