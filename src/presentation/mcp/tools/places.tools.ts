import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IPlaceService } from "@/application/places/services/interfaces/IPlaceService";
import { PlaceListFilters } from "@/domain/places/repositories/IPlaceRepository";
import { CONTENT_STATUSES } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from "@/domain/core/pagination/Pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import PlaceDtoMapper from "@/presentation/http/places/mappers/Place.mapper";
import {
  CreatePlaceSchema,
  placeNameField,
  targetAudienceField,
} from "@/presentation/http/places/validators/createPlace";
import { MAX_RADIUS_KM } from "@/presentation/http/places/validators/listPlaces";
import { toolError, toolErrorMessage, toolOk } from "../utils/toolResult";

const contentStatus = z.enum(CONTENT_STATUSES);

const placeOutput = z.object({
  id: z.string(),
  cantonId: z.number().int(),
  categoryId: z.number().int(),
  sourceId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().nullable(),
  // Weekly schedule keyed by weekday (monday..sunday); permissive on purpose.
  openingHours: z.record(z.string(), z.unknown()).nullable(),
  targetAudience: z.enum(TARGET_AUDIENCES),
  status: contentStatus,
  verifiedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginatedPlacesOutput = {
  data: z.array(placeOutput),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
};

const pageInput = z.number().int().min(1).default(1).describe("Página a devolver, empieza en 1.");
const pageSizeInput = z
  .number()
  .int()
  .min(1)
  .max(MAX_PAGE_SIZE)
  .default(DEFAULT_PAGE_SIZE)
  .describe(`Cantidad de lugares por página (máximo ${MAX_PAGE_SIZE}).`);

const cantonIdInput = z
  .number()
  .int()
  .positive()
  .optional()
  .describe("Id del cantón (INEC: provincia * 100 + cantón, ej. 101 = San José). Filtro opcional.");
const categoryIdInput = z
  .number()
  .int()
  .positive()
  .optional()
  .describe("Id de la categoría; se obtiene con la herramienta `list_categories`. Filtro opcional.");
const statusInput = contentStatus
  .optional()
  .describe("Estado del lugar a filtrar (PENDING, PUBLISHED, REJECTED, ARCHIVED). Si se omite se devuelven todos los estados.");

const listPlacesInput = {
  cantonId: cantonIdInput,
  provinceId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Id de la provincia (1 a 7, código INEC). Filtro opcional."),
  categoryId: categoryIdInput,
  targetAudience: targetAudienceField
    .optional()
    .describe("Público objetivo: EVERYONE, CHILDREN, ADULTS o SENIORS. Filtro opcional."),
  status: statusInput,
  page: pageInput,
  pageSize: pageSizeInput,
};

const searchPlacesInput = {
  query: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .describe("Texto a buscar dentro del nombre, la descripción o la dirección del lugar."),
  lat: z.number().min(-90).max(90).optional().describe("Latitud del centro de la búsqueda por radio. Se debe enviar junto con `lng` y `radiusKm`."),
  lng: z.number().min(-180).max(180).optional().describe("Longitud del centro de la búsqueda por radio. Se debe enviar junto con `lat` y `radiusKm`."),
  radiusKm: z
    .number()
    .positive()
    .max(MAX_RADIUS_KM)
    .optional()
    .describe(`Radio en kilómetros (mayor a 0, máximo ${MAX_RADIUS_KM}). Se debe enviar junto con \`lat\` y \`lng\`.`),
  categoryId: categoryIdInput,
  cantonId: cantonIdInput,
  status: statusInput,
  page: pageInput,
  pageSize: pageSizeInput,
};

const createPlaceInput = {
  cantonId: CreatePlaceSchema.shape.cantonId.describe(
    "Id del cantón donde está el lugar (INEC: provincia * 100 + cantón, ej. 101 = San José, 216 = Río Cuarto).",
  ),
  categoryId: CreatePlaceSchema.shape.categoryId.describe("Id de la categoría; se obtiene con la herramienta `list_categories`."),
  sourceId: CreatePlaceSchema.shape.sourceId.describe("UUID de la fuente de la información (opcional). Debe existir."),
  name: placeNameField.describe("Nombre del lugar (1 a 191 caracteres)."),
  description: CreatePlaceSchema.shape.description.describe("Descripción del lugar (opcional, máximo 5000 caracteres)."),
  latitude: CreatePlaceSchema.shape.latitude.describe("Latitud en grados decimales (-90 a 90). Costa Rica ronda 8 a 11."),
  longitude: CreatePlaceSchema.shape.longitude.describe("Longitud en grados decimales (-180 a 180). Costa Rica ronda -86 a -82."),
  address: CreatePlaceSchema.shape.address.describe("Dirección o señas del lugar (opcional, máximo 191 caracteres)."),
  openingHours: CreatePlaceSchema.shape.openingHours.describe(
    "Horario semanal (opcional). Objeto con las claves monday..sunday; cada una es una lista (máximo 6) de " +
      "intervalos { open: \"HH:MM\", close: \"HH:MM\" } en 24 horas con open < close y sin solaparse. " +
      "Lista vacía = cerrado ese día. Ejemplo: { \"monday\": [{ \"open\": \"08:00\", \"close\": \"17:00\" }], \"sunday\": [] }.",
  ),
  targetAudience: CreatePlaceSchema.shape.targetAudience.describe(
    "Público objetivo: EVERYONE (por defecto), CHILDREN, ADULTS o SENIORS.",
  ),
};

/** `lat`, `lng` and `radiusKm` work only together: all absent -> no radius; some absent -> `null` (invalid). */
function radiusFilter(lat?: number, lng?: number, radiusKm?: number): PlaceListFilters["radius"] | null {
  const provided = [lat, lng, radiusKm].filter((value) => value !== undefined).length;
  if (provided === 0) return undefined;
  if (provided < 3) return null;
  return { lat: lat!, lng: lng!, radiusKm: radiusKm! };
}

export function registerPlaceTools(server: McpServer, placeService: IPlaceService): void {
  server.registerTool(
    "list_places",
    {
      title: "Listar lugares",
      description:
        "Lista los lugares de Mi Vueltica ordenados por nombre, con filtros opcionales por cantón, provincia, " +
        "categoría, público objetivo y estado. A diferencia de la API pública, incluye lugares en cualquier estado " +
        "(PENDING, PUBLISHED, REJECTED, ARCHIVED) salvo que filtres por `status`. Si `total` es mayor que lo " +
        "devuelto, pide la siguiente página con `page`. Para buscar por texto o cercanía usa `search_places`.",
      inputSchema: listPlacesInput,
      outputSchema: paginatedPlacesOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ cantonId, provinceId, categoryId, targetAudience, status, page, pageSize }) => {
      try {
        const result = await placeService.list(
          { page, pageSize, sort: { field: "name", direction: "asc" } },
          {
            cantonId,
            provinceId,
            categoryId,
            targetAudience,
            statuses: status ? [status] : undefined,
          },
        );
        return toolOk({ ...toPaginatedResponse(result, PlaceDtoMapper.toResponse) });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "search_places",
    {
      title: "Buscar lugares",
      description:
        "Busca lugares por texto (en nombre, descripción o dirección), opcionalmente cerca de unas coordenadas. " +
        "Para buscar por cercanía envía `lat`, `lng` y `radiusKm` juntos. Se puede filtrar por categoría " +
        "(`categoryId`, ver `list_categories`), cantón y estado; sin `status` incluye todos los estados. " +
        "Resultados ordenados por nombre.",
      inputSchema: searchPlacesInput,
      outputSchema: paginatedPlacesOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query, lat, lng, radiusKm, categoryId, cantonId, status, page, pageSize }) => {
      try {
        const radius = radiusFilter(lat, lng, radiusKm);
        if (radius === null) {
          return toolErrorMessage("Para buscar por radio debes enviar `lat`, `lng` y `radiusKm` juntos.");
        }

        const result = await placeService.list(
          { page, pageSize, sort: { field: "name", direction: "asc" } },
          {
            categoryId,
            cantonId,
            statuses: status ? [status] : undefined,
            search: query,
            radius,
          },
        );
        return toolOk({ ...toPaginatedResponse(result, PlaceDtoMapper.toResponse) });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "create_place",
    {
      title: "Crear lugar",
      description:
        "Crea un lugar nuevo en estado PENDING (queda pendiente de revisión; no se publica solo). " +
        "Requiere `cantonId`, `categoryId` (usa `list_categories`), `name`, `latitude` y `longitude`. " +
        "Falla si el cantón, la categoría o la fuente no existen. Devuelve el lugar creado con su `id`, " +
        "que puedes usar como `placeId` en `create_event`. No es idempotente: llamarla dos veces crea dos lugares, " +
        "así que usa `search_places` antes para evitar duplicados.",
      inputSchema: createPlaceInput,
      outputSchema: placeOutput.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (input) => {
      try {
        const place = await placeService.create(input);
        return toolOk({ ...PlaceDtoMapper.toResponse(place) });
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
