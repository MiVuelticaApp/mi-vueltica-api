import { z } from "zod";
import { GeoFilters } from "@/domain/core/geo/GeoFilters";
import { MAX_RADIUS_KM, refineGeoQuery, toGeoFilters } from "@/presentation/http/core/validators/geo";

/** Radius and bounding-box arguments shared by the place and event list/search tools. */
export const geoInput = {
  lat: z.number().min(-90).max(90).optional().describe("Latitud del centro de la búsqueda por radio. Se envía junto con `lng` y `radiusKm`."),
  lng: z.number().min(-180).max(180).optional().describe("Longitud del centro de la búsqueda por radio. Se envía junto con `lat` y `radiusKm`."),
  radiusKm: z
    .number()
    .positive()
    .max(MAX_RADIUS_KM)
    .optional()
    .describe(`Radio en kilómetros (mayor a 0, máximo ${MAX_RADIUS_KM}). Se envía junto con \`lat\` y \`lng\`.`),
  minLat: z.number().min(-90).max(90).optional().describe("Latitud sur del área rectangular. Se envía junto con `minLng`, `maxLat` y `maxLng`."),
  minLng: z.number().min(-180).max(180).optional().describe("Longitud oeste del área rectangular. Se envía junto con `minLat`, `maxLat` y `maxLng`."),
  maxLat: z.number().min(-90).max(90).optional().describe("Latitud norte del área rectangular (>= `minLat`). Se envía junto con los otros tres."),
  maxLng: z.number().min(-180).max(180).optional().describe("Longitud este del área rectangular (>= `minLng`). Se envía junto con los otros tres."),
};

export const GEO_FILTER_HELP =
  "Ubicación (opcional, excluyentes entre sí): radio con `lat` + `lng` + `radiusKm`, o área rectangular con " +
  "`minLat` + `minLng` + `maxLat` + `maxLng` (min <= max); cada grupo se envía completo.";

type GeoArgs = { [K in keyof typeof geoInput]?: number };

/**
 * The domain geo filters from the tool arguments, with the same rules as `GET /places` and `GET /events`
 * (`refineGeoQuery`): all of a group together, min <= max, and radius and bbox never mixed.
 */
export function toGeoArgs(args: GeoArgs): { geo: GeoFilters } | { error: string } {
  const issues: string[] = [];
  refineGeoQuery(args, { addIssue: (issue: { message?: string }) => void issues.push(issue.message ?? "Filtro geográfico inválido") } as unknown as z.RefinementCtx);
  if (issues.length > 0) return { error: issues.join(". ") + "." };
  return { geo: toGeoFilters(args) };
}
