import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IEventService } from "@/application/events/services/interfaces/IEventService";
import { CONTENT_STATUSES, ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";
import EventDtoMapper from "@/presentation/http/events/mappers/Event.mapper";
import {
  CreateEventSchema,
  eventDescriptionField,
  eventTargetAudienceField,
  eventTitleField,
  isoDateTimeField,
} from "@/presentation/http/events/validators/createEvent";
import { EventListFilters } from "@/domain/events/repositories/IEventRepository";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/domain/core/pagination/Pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
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
  targetAudience: z.enum(TARGET_AUDIENCES),
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
  page: number;
  pageSize: number;
}

/** Builds the same filter object as the HTTP controller; the MCP caller is privileged (all statuses). `null` = invalid range. */
function buildFilters(args: ListArgs, search?: string): EventListFilters | null {
  const from = args.from ? new Date(args.from) : new Date();
  const to = args.to ? new Date(args.to) : undefined;
  if (args.from && to && from.getTime() > to.getTime()) return null;
  return {
    from,
    to,
    categoryId: args.categoryId,
    placeId: args.placeId,
    cantonId: args.cantonId,
    targetAudience: args.targetAudience,
    statuses: args.status ? [args.status] : undefined,
    search,
  };
}

// Datetimes stay strings here (the SDK takes a raw shape) and are parsed into `Date`s in the handler.
const createEventInput = {
  placeId: CreateEventSchema.shape.placeId.describe(
    "UUID del lugar donde ocurre el evento (opcional). Se obtiene con `search_places` o `list_places`, o es el `id` devuelto por `create_place`. Debe existir.",
  ),
  categoryId: CreateEventSchema.shape.categoryId.describe("Id de la categoría; se obtiene con la herramienta `list_categories`."),
  sourceId: CreateEventSchema.shape.sourceId.describe("UUID de la fuente de la información (opcional). Debe existir."),
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
};

export function registerEventTools(server: McpServer, eventService: IEventService): void {
  const runList = async (args: ListArgs, search?: string) => {
    try {
      const filters = buildFilters(args, search);
      if (!filters) return toolErrorMessage("`from` no puede ser posterior a `to`.");
      const result = await eventService.list(
        { page: args.page, pageSize: args.pageSize, sort: { field: "startsAt", direction: "asc" } },
        filters,
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
        "Incluye eventos en cualquier estado salvo que filtres por `status`. Si `total` es mayor que lo devuelto, " +
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
        "(rango de fechas, categoría, lugar, cantón, público, estado). Por defecto solo eventos próximos o en curso " +
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
        "`search_places` para encontrarlo). Las fechas son ISO 8601 con zona horaria y `endsAt` no puede ser " +
        "anterior a `startsAt`. Falla si el lugar, la categoría o la fuente no existen. No es idempotente: " +
        "llamarla dos veces crea dos eventos.",
      inputSchema: createEventInput,
      outputSchema: eventOutput,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ startsAt, endsAt, ...rest }) => {
      try {
        // `endsAt >= startsAt` is enforced by the domain schedule value object.
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
