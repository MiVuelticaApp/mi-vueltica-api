import z from "zod";
import { CANTON_NAME_MAX_LENGTH } from "@/domain/geography/valueObjects/cantonName.valueObject";

// Upper bound of the INT columns.
const MAX_INT_ID = 2147483647;

export const cantonNameField = z
  .string({ error: "El nombre es requerido" })
  .trim()
  .min(1, { message: "El nombre es requerido" })
  .max(CANTON_NAME_MAX_LENGTH, { message: `El nombre no puede exceder ${CANTON_NAME_MAX_LENGTH} caracteres` });

// Only the types are checked here. The INEC rule (id = provinceId * 100 + cantonNumber) is
// enforced once, by the Canton entity (400), so it also covers callers other than HTTP.
export const CreateCantonSchema = z.object({
  id: z
    .int({ error: "El id (código INEC) es requerido y debe ser un número entero" })
    .positive({ message: "El id debe ser un número positivo" })
    .max(MAX_INT_ID, { message: "El id es demasiado grande" }),
  provinceId: z
    .int({ error: "provinceId es requerido y debe ser un número entero" })
    .positive({ message: "provinceId debe ser un número positivo" })
    .max(MAX_INT_ID, { message: "provinceId es demasiado grande" }),
  name: cantonNameField,
});
