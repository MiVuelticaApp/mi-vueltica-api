import z from "zod";
import { PROVINCE_NAME_MAX_LENGTH } from "@/domain/geography/valueObjects/provinceName.valueObject";

// Upper bound of the INT primary key column.
const MAX_INT_ID = 2147483647;

export const provinceNameField = z
  .string({ error: "El nombre es requerido" })
  .trim()
  .min(1, { message: "El nombre es requerido" })
  .max(PROVINCE_NAME_MAX_LENGTH, { message: `El nombre no puede exceder ${PROVINCE_NAME_MAX_LENGTH} caracteres` });

export const CreateProvinceSchema = z.object({
  id: z
    .int({ error: "El id (código INEC) es requerido y debe ser un número entero" })
    .positive({ message: "El id debe ser un número positivo" })
    .max(MAX_INT_ID, { message: "El id es demasiado grande" }),
  name: provinceNameField,
});
