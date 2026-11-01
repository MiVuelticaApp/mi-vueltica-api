import z from "zod";
import { sourceNameField, sourceTypeField, sourceUrlField } from "./createSource";

export const UpdateSourceSchema = z.object({
  name: sourceNameField,
  url: sourceUrlField,
  type: sourceTypeField,
  lastCrawledAt: z.iso
    .datetime({ offset: true, error: "lastCrawledAt debe ser una fecha ISO 8601 válida" })
    .nullish(),
});
