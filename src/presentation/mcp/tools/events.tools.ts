import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IEventService } from "@/application/events/services/interfaces/IEventService";
import { CONTENT_STATUSES, ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";
import EventDtoMapper from "@/presentation/http/events/mappers/Event.mapper";
import {
  CreateEventBaseSchema,
  eventDescriptionField,
  eventTargetAudienceField,
  eventTitleField,
  isoDateTimeField,
} from "@/presentation/http/events/validators/createEvent";
import { EventListFilters } from "@/domain/events/repositories/IEventRepository";
import { MAX_RADIUS_KM } from "@/presentation/http/core/validators/geo";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/domain/core/pagination/Pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { planConditionsInput, planConditionsOutput } from "../utils/planConditions";
import { toolError, toolErrorMessage, toolOk } from "../utils/toolResult";

const eventOutput = {
  id: z.string(),
  placeId: z.string().nullable(),
  categoryId: z.number().int(),
  sourceId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  address: z.string().nullable(),
  place: z
    .object({
      id: z.string(),
      name: z.string(),
      cantonId: z.number().int(),
      latitude: z.number(),
      longitude: z.number(),
      address: z.string().nullable(),
      status: z.enum(CONTENT_STATUSES),
    })
    .nullable(),
  targetAudience: z.enum(TARGET_AUDIENCES),
  ...planConditionsOutput,
  authorName: z.string().nullable(),
  status: z.enum(CONTENT_STATUSES),
  createdAt: z.string(),
  updatedAt: z.string(),
};

const paginatedEventsOutput = {
  data: z.array(z.object(eventOutput)),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
};

const listFiltersInput = {
  from: isoDateTimeField("from")
    .optional()
    .describe(
      "Inicio del rango en ISO 8601 con zona horaria (ej. 2026-12-01T00:00:00-06:00). Por defecto es el momento actual, " +
        "es decir, solo eventos próximos o en curso; envía una fecha anterior para ver eventos pasados.",
    ),
  to: isoDateTimeField("to")
    .optional()
    .describe("Fin del rango en ISO 8601 con zona horaria: solo eventos que empiezan en o antes de esta fecha. No puede ser anterior a `from`."),
  categoryId: z.number().int().positive().optional().describe("Id de la categoría; se obtiene con `list_categories`. Filtro opcional."),
  placeId: z.string().uuid().optional().describe("UUID del lugar donde ocurre el evento (ver `search_places`). Filtro opcional."),
  cantonId: z.number().int().positive().optional().describe("Id del cantón del lugar del evento (INEC: provincia * 100 + cantón, ej. 101 = San José). Filtro opcional."),
  targetAudience: eventTargetAudienceField.optional().describe("Público objetivo: EVERYONE, CHILDREN, ADULTS o SENIORS. Filtro opcional."),
  status: z
    .enum(CONTENT_STATUSES)
    .optional()
    .describe("Estado a filtrar (PENDING, PUBLISHED, REJECTED, ARCHIVED). Si se omite se devuelven todos los estados."),
  lat: z
    .number()
    .min(-90)
    .max(90)
    .optional()
    .describe("Latitud del centro de la búsqueda por radio. Se debe enviar junto con `lng` y `radiusKm`."),
  lng: z
    .number()
    .min(-180)
    .max(180)
    .optional()
    .describe("Longitud del centro de la búsqueda por radio. Se debe enviar junto con `lat` y `radiusKm`."),
  radiusKm: z
    .number()
    .positive()
    .max(MAX_RADIUS_KM)
    .optional()
    .describe(
      `Radio en kilómetros (mayor a 0, máximo ${MAX_RADIUS_KM}). Usa la ubicación del lugar del evento o la del propio ` +
        "evento si no tiene lugar; los eventos sin ubicación no aparecen. Se debe enviar junto con `lat` y `lng`.",
    ),
  page: z.number().int().min(1).default(1).describe("Página a devolver, empieza en 1."),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .describe(`Cantidad de eventos por página (máximo ${MAX_PAGE_SIZE}).`),
};

const listEventsInput = listFiltersInput;
const searchEventsInput = {
  query: z.string().trim().min(1).max(100).describe("Texto a buscar dentro del título o la descripción del evento."),
  ...listFiltersInput,
};

interface ListArgs {
  from?: string;
  to?: string;
  categoryId?: number;
  placeId?: string;
  cantonId?: number;
  targetAudience?: EventListFilters["targetAudience"];
  status?: ContentStatus;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page: number;
  pageSize: number;
}

/**
 * Builds the same filter object as the HTTP controller; the MCP caller is privileged (all statuses).
 * Cross-field rules live here because the SDK takes raw shapes (no object-level refinements).
 */
function buildFilters(args: ListArgs, search?: string): { filters: EventListFilters } | { error: string } {
  const from = args.from ? new Date(args.from) : new Date();
  const to = args.to ? new Date(args.to) : undefined;
  if (args.from && to && from.getTime() > to.getTime()) return { error: "`from` no puede ser posterior a `to`." };
  const radiusArgs = [args.lat, args.lng, args.radiusKm].filter((value) => value !== undefined).length;
  if (radiusArgs > 0 && radiusArgs < 3) {
    return { error: "Para buscar por radio debes enviar `lat`, `lng` y `radiusKm` juntos." };
  }
  return {
    filters: {
      from,
      to,
      categoryId: args.categoryId,
      placeId: args.placeId,
      cantonId: args.cantonId,
      targetAudience: args.targetAudience,
      statuses: args.status ? [args.status] : undefined,
      search,
      radius: radiusArgs === 3 ? { lat: args.lat!, lng: args.lng!, radiusKm: args.radiusKm! } : undefined,
    },
  };
}

// Datetimes stay strings here (the SDK takes a raw shape) and are parsed into `Date`s in the handler.
const createEventInput = {
  placeId: CreateEventBaseSchema.shape.placeId.describe(
    "UUID del lugar donde ocurre el evento (opcional). Se obtiene con `search_places` o `list_places`, o es el `id` devuelto por `create_place`. Debe existir. " +
      "Si el evento ocurre en un lugar registrado, usa `placeId` y no envíes `latitude`/`longitude`/`address`.",
  ),
  latitude: CreateEventBaseSchema.shape.latitude.describe(
    "Latitud propia del evento (grados decimales, Costa Rica ronda 8 a 11), solo si NO tiene `placeId` (ej. una feria en la calle). Va junto con `longitude`.",
  ),
  longitude: CreateEventBaseSchema.shape.longitude.describe(
    "Longitud propia del evento (grados decimales, Costa Rica ronda -86 a -82), solo si NO tiene `placeId`. Va junto con `latitude`.",
  ),
  address: CreateEventBaseSchema.shape.address.describe(
    "Dirección o señas del evento (opcional, máximo 191 caracteres), solo si NO tiene `placeId` y se envían `latitude` y `longitude`.",
  ),
  categoryId: CreateEventBaseSchema.shape.categoryId.describe("Id de la categoría; se obtiene con la herramienta `list_categories`."),
  sourceId: CreateEventBaseSchema.shape.sourceId.describe("UUID de la fuente de la información (opcional). Debe existir."),
  title: eventTitleField.describe("Título del evento (1 a 191 caracteres)."),
  description: eventDescriptionField.nullish().describe("Descripción del evento (opcional, máximo 5000 caracteres)."),
  startsAt: isoDateTimeField("startsAt").describe(
    "Fecha y hora de inicio en ISO 8601 con zona horaria obligatoria, ej. 2026-12-01T18:00:00-06:00 (Costa Rica es UTC-6) o 2026-12-02T00:00:00Z.",
  ),
  endsAt: isoDateTimeField("endsAt")
    .nullish()
    .describe("Fecha y hora de fin en ISO 8601 con zona horaria (opcional). No puede ser anterior a `startsAt`."),
  targetAudience: eventTargetAudienceField
    .default("EVERYONE")
    .describe("Público objetivo: EVERYONE (por defecto), CHILDREN, ADULTS o SENIORS."),
  ...planConditionsInput,
};

export function registerEventTools(server: McpServer, eventService: IEventService): void {
  const runList = async (args: ListArgs, search?: string) => {
    try {
      const built = buildFilters(args, search);
      if ("error" in built) return toolErrorMessage(built.error);
      const result = await eventService.list(
        { page: args.page, pageSize: args.pageSize, sort: { field: "startsAt", direction: "asc" } },
        built.filters,
      );
      return toolOk({ ...toPaginatedResponse(result, EventDtoMapper.toResponse) });
    } catch (error) {
      return toolError(error);
    }
  };

  server.registerTool(
    "list_events",
    {
      title: "Listar eventos",
      description:
        "Lista los eventos de Mi Vueltica ordenados por fecha de inicio (los más próximos primero). Por defecto solo " +
        "devuelve eventos próximos o en curso (`from` = ahora); envía un `from` anterior para ver eventos pasados. " +
        "Incluye eventos en cualquier estado salvo que filtres por `status`. Para buscar cerca de un punto envía `lat`, " +
        "`lng` y `radiusKm` juntos. Si `total` es mayor que lo devuelto, " +
        "pide la siguiente página. Para buscar por texto usa `search_events`.",
      inputSchema: listEventsInput,
      outputSchema: paginatedEventsOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    (args) => runList(args),
  );

  server.registerTool(
    "search_events",
    {
      title: "Buscar eventos",
      description:
        "Busca eventos por texto en el título o la descripción, con los mismos filtros opcionales que `list_events` " +
        "(rango de fechas, categoría, lugar, cantón, público, estado, radio). Por defecto solo eventos próximos o en curso " +
        "(`from` = ahora). Útil para evitar duplicados antes de usar `create_event`. Ordenados por fecha de inicio.",
      inputSchema: searchEventsInput,
      outputSchema: paginatedEventsOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ query, ...args }) => runList(args, query),
  );

  server.registerTool(
    "create_event",
    {
      title: "Crear evento",
      description:
        "Crea un evento nuevo en estado PENDING (queda pendiente de revisión; no se publica solo). " +
        "Requiere `categoryId` (usa `list_categories`), `title` y `startsAt`; `placeId` es opcional (usa " +
        "`search_places` para encontrarlo); un evento sin lugar puede llevar su propia ubicación (`latitude`, `longitude`, " +
        "`address`), pero nunca ambas cosas. Las fechas son ISO 8601 con zona horaria y `endsAt` no puede ser " +
        "anterior a `startsAt`. Falla si el lugar, la categoría o la fuente no existen. No es idempotente: " +
        "llamarla dos veces crea dos eventos.",
      inputSchema: createEventInput,
      outputSchema: eventOutput,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ startsAt, endsAt, ...rest }) => {
      try {
        // `endsAt >= startsAt` and the placeId-or-own-location rule are enforced by the domain value objects.
        const event = await eventService.create({
          ...rest,
          startsAt: new Date(startsAt),
          endsAt: endsAt ? new Date(endsAt) : null,
        });
        return toolOk({ ...EventDtoMapper.toResponse(event) });
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
