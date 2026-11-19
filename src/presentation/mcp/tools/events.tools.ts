import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IEventService } from "@/application/events/services/interfaces/IEventService";
import { CONTENT_STATUSES, ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PriceTier } from "@/domain/places/valueObjects/planConditions.valueObject";
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
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/domain/core/pagination/Pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { geoInput, GEO_FILTER_HELP, toGeoArgs } from "../utils/geo";
import { planConditionsInput, planConditionsOutput, planFiltersInput, planStatsOutput, toPlanFilters } from "../utils/planConditions";
import { strictInput } from "../utils/strictInput";
import type { McpCaller } from "../server/createMcpServer";
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
  cantonId: z.number().int().nullable(),
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
  hiddenReason: z.string().nullable(),
  authorName: z.string().nullable(),
  status: z.enum(CONTENT_STATUSES),
  createdAt: z.string(),
  updatedAt: z.string(),
};

const paginatedEventsOutput = {
  data: z.array(z.object({ ...eventOutput, ...planStatsOutput })),
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
  cantonId: z.number().int().positive().optional().describe("Id del cantón del evento (INEC: provincia * 100 + cantón, ej. 101 = San José): el de su lugar, o el propio si no tiene lugar. Filtro opcional."),
  targetAudience: eventTargetAudienceField.optional().describe("Público objetivo: EVERYONE, CHILDREN, ADULTS o SENIORS. Filtro opcional."),
  status: z
    .enum(CONTENT_STATUSES)
    .optional()
    .describe("Estado a filtrar (PENDING, PUBLISHED, REJECTED, ARCHIVED). Si se omite se devuelven todos los estados."),
  ...planFiltersInput,
  ...geoInput,
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
  maxPrice?: PriceTier;
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
}

/**
 * Builds the same filter object as the HTTP controller; the MCP caller is privileged (all statuses).
 * Cross-field rules live here because the SDK takes raw shapes (no object-level refinements).
 */
function buildFilters(args: ListArgs, search?: string): { filters: EventListFilters } | { error: string } {
  const from = args.from ? new Date(args.from) : new Date();
  const to = args.to ? new Date(args.to) : undefined;
  if (args.from && to && from.getTime() > to.getTime()) return { error: "`from` no puede ser posterior a `to`." };
  const geo = toGeoArgs(args);
  if ("error" in geo) return { error: geo.error };
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
      ...toPlanFilters(args),
      ...geo.geo,
    },
  };
}

// Datetimes stay strings here (the SDK takes a raw shape) and are parsed into `Date`s in the handler.
const createEventInput = {
  placeId: CreateEventBaseSchema.shape.placeId.describe(
    "UUID del lugar donde ocurre el evento (opcional). Se obtiene con `search_places` o `list_places`, o es el `id` devuelto por `create_place`. Debe existir. " +
      "Si el evento ocurre en un lugar registrado, usa `placeId` y no envíes `latitude`/`longitude`/`address`/`cantonId`.",
  ),
  cantonId: CreateEventBaseSchema.shape.cantonId.describe(
    "Id del cantón propio del evento (INEC: provincia * 100 + cantón, ej. 101 = San José), solo si NO tiene `placeId` " +
      "(con lugar se usa el cantón del lugar). Opcional, pero sin él el evento no aparece al filtrar por cantón. Debe existir.",
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
  sourceId: CreateEventBaseSchema.shape.sourceId.describe("UUID de la fuente de la información (opcional, se obtiene con `list_sources`). Debe existir."),
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

const updateEventInput = {
  id: z.string().uuid().describe("UUID del evento a reemplazar (ver `list_events` / `search_events`)."),
  ...createEventInput,
};

export function registerEventTools(server: McpServer, eventService: IEventService, caller: McpCaller): void {
  const runList = async (args: ListArgs, search?: string) => {
    try {
      const built = buildFilters(args, search);
      if ("error" in built) return toolErrorMessage(built.error);
      const result = await eventService.list(
        { page: args.page, pageSize: args.pageSize, sort: { field: "startsAt", direction: "asc" } },
        built.filters,
      );
      return toolOk({ ...toPaginatedResponse(result, EventDtoMapper.toCardResponse) });
    } catch (error) {
      return toolError(error);
    }
  };

  server.registerTool(
    "list_events",
    {
      title: "Listar eventos",
      description:
        "Lista los eventos de Mi VuelTica ordenados por fecha de inicio (los más próximos primero). Por defecto solo " +
        "devuelve eventos próximos o en curso (`from` = ahora); envía un `from` anterior para ver eventos pasados. " +
        "Incluye eventos en cualquier estado salvo que filtres por `status`. También filtra por precio y accesibilidad " +
        "(`maxPrice`, `students`, `seniors`, `families`, `wheelchair`). " + GEO_FILTER_HELP + " Si `total` es mayor que lo devuelto, " +
        "pide la siguiente página. Para buscar por texto usa `search_events`.",
      inputSchema: strictInput(listEventsInput),
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
        "(rango de fechas, categoría, lugar, cantón, público, estado, precio, accesibilidad, radio o área). Por defecto solo eventos próximos o en curso " +
        "(`from` = ahora). Útil para evitar duplicados antes de usar `create_event`. Ordenados por fecha de inicio.",
      inputSchema: strictInput(searchEventsInput),
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
        "Crea un evento nuevo en estado PENDING (queda pendiente de revisión; no se publica solo): para publicarlo usa `set_event_status`. " +
        "Requiere `categoryId` (usa `list_categories`), `title` y `startsAt`; `placeId` es opcional (usa " +
        "`search_places` para encontrarlo); un evento sin lugar puede llevar su propia ubicación (`latitude`, `longitude`, " +
        "`address`) y su `cantonId`, pero nunca junto con `placeId`. Las fechas son ISO 8601 con zona horaria y `endsAt` no puede ser " +
        "anterior a `startsAt`. Falla si el lugar, el cantón, la categoría o la fuente no existen (fuentes: `list_sources`). " +
        "Argumentos desconocidos (p. ej. `status`) se rechazan. No es idempotente: " +
        "llamarla dos veces crea dos eventos.",
      inputSchema: strictInput(createEventInput),
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

  server.registerTool(
    "update_event",
    {
      title: "Actualizar evento",
      description:
        "REEMPLAZA TODOS los campos editables de un evento existente (equivale a `PUT /events/:id`): los campos opcionales " +
        "que omitas se borran o vuelven a su valor por defecto (descripción, `endsAt`, ubicación propia, cantón, precio, " +
        "públicos, `freeFor`, `wheelchair`...). Por eso primero obtén los valores actuales con `search_events` o " +
        "`list_events` y reenvía todo lo que quieras conservar junto con tus cambios. Ojo: las respuestas traen " +
        "`latitude`/`longitude`/`address`/`cantonId` ya resueltos desde el lugar; si el evento tiene `placeId` NO los reenvíes " +
        "(falla). Pasar un `placeId` borra la ubicación y el cantón propios. El estado no cambia (usa `set_event_status`). " +
        "Falla si el evento, el lugar, el cantón, la categoría o la fuente no existen.",
      inputSchema: strictInput(updateEventInput),
      outputSchema: eventOutput,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, startsAt, endsAt, ...rest }) => {
      try {
        const event = await eventService.update(id, {
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

  server.registerTool(
    "set_event_status",
    {
      title: "Cambiar estado de un evento",
      description:
        "Cambia el estado de un evento (equivale a `PATCH /events/:id/status`): PUBLISHED lo publica, PENDING lo deja en " +
        "revisión, REJECTED lo rechaza y ARCHIVED lo oculta. Los eventos creados con `create_event` nacen PENDING y solo " +
        "se ven en la app al publicarlos aquí. El cambio queda registrado en el log del servidor con tu usuario.",
      inputSchema: strictInput({
        id: z.string().uuid().describe("UUID del evento."),
        status: z.enum(CONTENT_STATUSES).describe("Nuevo estado: PENDING, PUBLISHED, REJECTED o ARCHIVED."),
      }),
      outputSchema: eventOutput,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, status }) => {
      try {
        const event = await eventService.changeStatus(id, status);
        console.info("[mcp] set_event_status", { userId: caller.userId, role: caller.role, eventId: id, status });
        return toolOk({ ...EventDtoMapper.toResponse(event) });
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
