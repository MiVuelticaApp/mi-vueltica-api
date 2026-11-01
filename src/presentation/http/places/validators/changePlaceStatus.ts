import z from "zod";
import { CONTENT_STATUSES } from "@/domain/places/valueObjects/contentStatus.valueObject";

export const contentStatusField = z.enum(CONTENT_STATUSES, { error: "El estado no es válido" });

export const ChangePlaceStatusSchema = z.object({
  status: contentStatusField,
});
