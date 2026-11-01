import z from "zod";
import { SOURCE_NAME_MAX_LENGTH } from "@/domain/sources/valueObjects/sourceName.valueObject";
import { SOURCE_URL_MAX_LENGTH, SourceUrl } from "@/domain/sources/valueObjects/sourceUrl.valueObject";
import { SOURCE_TYPES } from "@/domain/sources/valueObjects/sourceType.valueObject";

export const sourceNameField = z
  .string({ error: "El nombre es requerido" })
  .trim()
  .min(1, { message: "El nombre es requerido" })
  .max(SOURCE_NAME_MAX_LENGTH, { message: `El nombre no puede exceder ${SOURCE_NAME_MAX_LENGTH} caracteres` });

export const sourceUrlField = z
  .string({ error: "La URL debe ser texto" })
  .trim()
  .max(SOURCE_URL_MAX_LENGTH, { message: `La URL no puede exceder ${SOURCE_URL_MAX_LENGTH} caracteres` })
  .url({ message: "La URL no es válida" })
  .refine((value) => SourceUrl.isHttpUrl(value), { message: "La URL debe usar http o https" })
  .nullish();

export const sourceTypeField = z.enum(SOURCE_TYPES, { error: "El tipo de fuente no es válido" });

export const CreateSourceSchema = z.object({
  name: sourceNameField,
  url: sourceUrlField,
  type: sourceTypeField,
});
