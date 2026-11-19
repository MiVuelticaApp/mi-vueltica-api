import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IPlaceService } from "@/application/places/services/interfaces/IPlaceService";
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
import { geoInput, GEO_FILTER_HELP, toGeoArgs } from "../utils/geo";
import { planConditionsInput, planConditionsOutput, planFiltersInput, planStatsOutput, toPlanFilters } from "../utils/planConditions";
import { strictInput } from "../utils/strictInput";
import type { McpCaller } from "../server/createMcpServer";
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
  ...planConditionsOutput,
  hiddenReason: z.string().nullable(),
  authorName: z.string().nullable(),
  status: contentStatus,
  verifiedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginatedPlacesOutput = {
  data: z.array(placeOutput.extend(planStatsOutput)),
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
  ...planFiltersInput,
  ...geoInput,
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
  categoryId: categoryIdInput,
  cantonId: cantonIdInput,
  status: statusInput,
  ...planFiltersInput,
  ...geoInput,
  page: pageInput,
  pageSize: pageSizeInput,
};

const createPlaceInput = {
  cantonId: CreatePlaceSchema.shape.cantonId.describe(
    "Id del cantón donde está el lugar (INEC: provincia * 100 + cantón, ej. 101 = San José, 216 = Río Cuarto).",
  ),
  categoryId: CreatePlaceSchema.shape.categoryId.describe("Id de la categoría; se obtiene con la herramienta `list_categories`."),
  sourceId: CreatePlaceSchema.shape.sourceId.describe("UUID de la fuente de la información (opcional, se obtiene con `list_sources`). Debe existir."),
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
  ...planConditionsInput,
};

const updatePlaceInput = {
  id: z.string().uuid().describe("UUID del lugar a reemplazar (ver `list_places` / `search_places`)."),
  ...createPlaceInput,
};

export function registerPlaceTools(server: McpServer, placeService: IPlaceService, caller: McpCaller): void {
  type ListArgs = {
    cantonId?: number;
    provinceId?: number;
    categoryId?: number;
    targetAudience?: z.infer<typeof targetAudienceField>;
    status?: z.infer<typeof contentStatus>;
    maxPrice?: z.infer<typeof planFiltersInput.maxPrice>;
    students?: boolean;
    seniors?: boolean;
    families?: boolean;
    wheelchair?: boolean;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    minLat?: number;
    minLng?: number;
    maxLat?: number;
    maxLng?: number;
    page: number;
    pageSize: number;
  };

  // The MCP caller is privileged: every status unless `status` is given. Cross-field geo rules live in `toGeoArgs`.
  const runList = async (args: ListArgs, search?: string) => {
    try {
      const geo = toGeoArgs(args);
      if ("error" in geo) return toolErrorMessage(geo.error);
      const result = await placeService.list(
        { page: args.page, pageSize: args.pageSize, sort: { field: "name", direction: "asc" } },
        {
          cantonId: args.cantonId,
          provinceId: args.provinceId,
          categoryId: args.categoryId,
          targetAudience: args.targetAudience,
          statuses: args.status ? [args.status] : undefined,
          search,
          ...toPlanFilters(args),
          ...geo.geo,
        },
      );
      return toolOk({ ...toPaginatedResponse(result, PlaceDtoMapper.toCardResponse) });
    } catch (error) {
      return toolError(error);
    }
  };

  server.registerTool(
    "list_places",
    {
      title: "Listar lugares",
      description:
        "Lista los lugares de Mi VuelTica ordenados por nombre, con filtros opcionales por cantón, provincia, " +
        "categoría, público objetivo, estado, precio y accesibilidad (`maxPrice`, `students`, `seniors`, `families`, " +
        "`wheelchair`) y ubicación. " + GEO_FILTER_HELP + " A diferencia de la API pública, incluye lugares en cualquier estado " +
        "(PENDING, PUBLISHED, REJECTED, ARCHIVED) salvo que filtres por `status`. Si `total` es mayor que lo " +
        "devuelto, pide la siguiente página con `page`. Para buscar por texto o cercanía usa `search_places`.",
      inputSchema: strictInput(listPlacesInput),
      outputSchema: paginatedPlacesOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    (args) => runList(args),
  );

  server.registerTool(
    "search_places",
    {
      title: "Buscar lugares",
      description:
        "Busca lugares por texto (en nombre, descripción o dirección), con los mismos filtros que `list_places` " +
        "(categoría, cantón, estado, precio y accesibilidad). " + GEO_FILTER_HELP + " Sin `status` incluye todos los estados. " +
        "Resultados ordenados por nombre.",
      inputSchema: strictInput(searchPlacesInput),
      outputSchema: paginatedPlacesOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ query, ...args }) => runList(args, query),
  );

  server.registerTool(
    "create_place",
    {
      title: "Crear lugar",
      description:
        "Crea un lugar nuevo en estado PENDING (queda pendiente de revisión; no se publica solo): para publicarlo usa `set_place_status`. " +
        "Requiere `cantonId`, `categoryId` (usa `list_categories`), `name`, `latitude` y `longitude`. " +
        "Falla si el cantón, la categoría o la fuente no existen (fuentes: `list_sources`). Argumentos desconocidos se rechazan. Devuelve el lugar creado con su `id`, " +
        "que puedes usar como `placeId` en `create_event`. No es idempotente: llamarla dos veces crea dos lugares, " +
        "así que usa `search_places` antes para evitar duplicados.",
      inputSchema: strictInput(createPlaceInput),
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

  server.registerTool(
    "update_place",
    {
      title: "Actualizar lugar",
      description:
        "REEMPLAZA TODOS los campos editables de un lugar existente (equivale a `PUT /places/:id`): los campos opcionales " +
        "que omitas se borran o vuelven a su valor por defecto (descripción, dirección, horario, precio, públicos, " +
        "`freeFor`, `wheelchair`...). Por eso primero obtén los valores actuales con `search_places` o `list_places` y " +
        "reenvía todo lo que quieras conservar junto con tus cambios. El estado no cambia (usa `set_place_status`). " +
        "Falla si el lugar, el cantón, la categoría o la fuente no existen.",
      inputSchema: strictInput(updatePlaceInput),
      outputSchema: placeOutput.shape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, ...data }) => {
      try {
        const place = await placeService.update(id, data);
        return toolOk({ ...PlaceDtoMapper.toResponse(place) });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "set_place_status",
    {
      title: "Cambiar estado de un lugar",
      description:
        "Cambia el estado de un lugar (equivale a `PATCH /places/:id/status`): PUBLISHED lo publica (y actualiza su " +
        "fecha de verificación), PENDING lo deja en revisión, REJECTED lo rechaza y ARCHIVED lo oculta. Los lugares " +
        "creados con `create_place` nacen PENDING y solo se ven en la app al publicarlos aquí. El cambio queda " +
        "registrado en el log del servidor con tu usuario.",
      inputSchema: strictInput({
        id: z.string().uuid().describe("UUID del lugar."),
        status: contentStatus.describe("Nuevo estado: PENDING, PUBLISHED, REJECTED o ARCHIVED."),
      }),
      outputSchema: placeOutput.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, status }) => {
      try {
        const place = await placeService.changeStatus(id, status);
        console.info("[mcp] set_place_status", { userId: caller.userId, role: caller.role, placeId: id, status });
        return toolOk({ ...PlaceDtoMapper.toResponse(place) });
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
