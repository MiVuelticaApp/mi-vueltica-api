import z from "zod";
import { PLACE_NAME_MAX_LENGTH } from "@/domain/places/valueObjects/placeName.valueObject";
import { PLACE_DESCRIPTION_MAX_LENGTH } from "@/domain/places/valueObjects/placeDescription.valueObject";
import { PLACE_ADDRESS_MAX_LENGTH } from "@/domain/places/valueObjects/placeAddress.valueObject";
import {
  MAX_LATITUDE,
  MAX_LONGITUDE,
  MIN_LATITUDE,
  MIN_LONGITUDE,
} from "@/domain/places/valueObjects/coordinates.valueObject";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { OpeningHoursSchema } from "./openingHours";

export const placeNameField = z
  .string({ error: "El nombre es requerido" })
  .trim()
  .min(1, { message: "El nombre es requerido" })
  .max(PLACE_NAME_MAX_LENGTH, { message: `El nombre no puede exceder ${PLACE_NAME_MAX_LENGTH} caracteres` });

export const targetAudienceField = z.enum(TARGET_AUDIENCES, { error: "El público objetivo no es válido" });

export const CreatePlaceSchema = z.object({
  cantonId: z
    .number({ error: "El cantón es requerido" })
    .int("El cantón debe ser un número entero")
    .positive("El cantón debe ser un número positivo"),
  categoryId: z
    .number({ error: "La categoría es requerida" })
    .int("La categoría debe ser un número entero")
    .positive("La categoría debe ser un número positivo"),
  sourceId: z.uuid({ error: "La fuente debe ser un UUID válido" }).nullish(),
  name: placeNameField,
  description: z
    .string({ error: "La descripción debe ser texto" })
    .trim()
    .max(PLACE_DESCRIPTION_MAX_LENGTH, { message: `La descripción no puede exceder ${PLACE_DESCRIPTION_MAX_LENGTH} caracteres` })
    .nullish(),
  latitude: z
    .number({ error: "La latitud es requerida y debe ser un número" })
    .min(MIN_LATITUDE, { message: `La latitud debe estar entre ${MIN_LATITUDE} y ${MAX_LATITUDE}` })
    .max(MAX_LATITUDE, { message: `La latitud debe estar entre ${MIN_LATITUDE} y ${MAX_LATITUDE}` }),
  longitude: z
    .number({ error: "La longitud es requerida y debe ser un número" })
    .min(MIN_LONGITUDE, { message: `La longitud debe estar entre ${MIN_LONGITUDE} y ${MAX_LONGITUDE}` })
    .max(MAX_LONGITUDE, { message: `La longitud debe estar entre ${MIN_LONGITUDE} y ${MAX_LONGITUDE}` }),
  address: z
    .string({ error: "La dirección debe ser texto" })
    .trim()
    .max(PLACE_ADDRESS_MAX_LENGTH, { message: `La dirección no puede exceder ${PLACE_ADDRESS_MAX_LENGTH} caracteres` })
    .nullish(),
  openingHours: OpeningHoursSchema.nullish(),
  targetAudience: targetAudienceField.default("EVERYONE"),
});
