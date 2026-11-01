import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/core/validators/pagination";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { contentStatusField } from "./changePlaceStatus";

export const PLACE_SORT_FIELDS = ["name", "createdAt", "updatedAt"] as const;
export const MAX_RADIUS_KM = 500;

const intFilter = (label: string) =>
  z.coerce
    .number({ error: `${label} debe ser un número` })
    .int(`${label} debe ser un número entero`)
    .positive(`${label} debe ser un número positivo`)
    .optional();

const coordinate = (label: string, limit: number) =>
  z.coerce
    .number({ error: `${label} debe ser un número` })
    .min(-limit, { message: `${label} debe estar entre -${limit} y ${limit}` })
    .max(limit, { message: `${label} debe estar entre -${limit} y ${limit}` })
    .optional();

const BBOX_KEYS = ["minLat", "minLng", "maxLat", "maxLng"] as const;
const RADIUS_KEYS = ["lat", "lng", "radiusKm"] as const;

export const ListPlacesQuerySchema = createPaginationQuerySchema(PLACE_SORT_FIELDS)
  .extend({
    cantonId: intFilter("El cantón"),
    provinceId: intFilter("La provincia"),
    categoryId: intFilter("La categoría"),
    targetAudience: z.enum(TARGET_AUDIENCES, { error: "El público objetivo no es válido" }).optional(),
    // Only honored for MODERATOR / ADMIN; ignored for everyone else.
    status: contentStatusField.optional(),
    q: z.string().trim().max(100, { message: "La búsqueda no puede exceder 100 caracteres" }).optional(),
    minLat: coordinate("minLat", 90),
    minLng: coordinate("minLng", 180),
    maxLat: coordinate("maxLat", 90),
    maxLng: coordinate("maxLng", 180),
    lat: coordinate("lat", 90),
    lng: coordinate("lng", 180),
    radiusKm: z.coerce
      .number({ error: "radiusKm debe ser un número" })
      .positive("radiusKm debe ser mayor a 0")
      .max(MAX_RADIUS_KM, { message: `radiusKm no puede ser mayor a ${MAX_RADIUS_KM}` })
      .optional(),
  })
  .superRefine((query, ctx) => {
    const bboxCount = BBOX_KEYS.filter((key) => query[key] !== undefined).length;
    const radiusCount = RADIUS_KEYS.filter((key) => query[key] !== undefined).length;

    if (bboxCount > 0 && radiusCount > 0) {
      ctx.addIssue({
        code: "custom",
        message: "El filtro por área (minLat, minLng, maxLat, maxLng) y el filtro por radio (lat, lng, radiusKm) son excluyentes",
      });
      return;
    }
    if (bboxCount > 0 && bboxCount < BBOX_KEYS.length) {
      ctx.addIssue({ code: "custom", message: "minLat, minLng, maxLat y maxLng deben enviarse juntos" });
      return;
    }
    if (bboxCount === BBOX_KEYS.length) {
      if (query.minLat! > query.maxLat!) {
        ctx.addIssue({ code: "custom", message: "minLat no puede ser mayor que maxLat" });
      }
      if (query.minLng! > query.maxLng!) {
        ctx.addIssue({ code: "custom", message: "minLng no puede ser mayor que maxLng" });
      }
    }
    if (radiusCount > 0 && radiusCount < RADIUS_KEYS.length) {
      ctx.addIssue({ code: "custom", message: "lat, lng y radiusKm deben enviarse juntos" });
    }
  });
