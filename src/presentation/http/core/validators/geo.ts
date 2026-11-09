import z from "zod";
import { GeoFilters } from "@/domain/core/geo/GeoFilters";

/** Geo query params shared by `GET /places` and `GET /events`. */
export const MAX_RADIUS_KM = 500;

const coordinate = (label: string, limit: number) =>
  z.coerce
    .number({ error: `${label} debe ser un número` })
    .min(-limit, { message: `${label} debe estar entre -${limit} y ${limit}` })
    .max(limit, { message: `${label} debe estar entre -${limit} y ${limit}` })
    .optional();

const BBOX_KEYS = ["minLat", "minLng", "maxLat", "maxLng"] as const;
const RADIUS_KEYS = ["lat", "lng", "radiusKm"] as const;

/** Spread into a query schema with `.extend()`, then add `refineGeoQuery` with `.superRefine()`. */
export const geoQueryFields = {
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
};

type GeoQuery = { [K in keyof typeof geoQueryFields]?: number };

/** Bounding box (all four, min <= max) **or** radius (all three); mixing them is a 400. */
export function refineGeoQuery(query: GeoQuery, ctx: z.RefinementCtx): void {
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
}

/** The domain filters from a query that passed `refineGeoQuery`. */
export function toGeoFilters(query: GeoQuery): GeoFilters {
  if (query.minLat !== undefined) {
    return { bbox: { minLat: query.minLat, minLng: query.minLng!, maxLat: query.maxLat!, maxLng: query.maxLng! } };
  }
  if (query.lat !== undefined) {
    return { radius: { lat: query.lat, lng: query.lng!, radiusKm: query.radiusKm! } };
  }
  return {};
}
