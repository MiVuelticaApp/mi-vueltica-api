import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ISourceService } from "@/application/sources/services/interfaces/ISourceService";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/domain/core/pagination/Pagination";
import { SOURCE_TYPES } from "@/domain/sources/valueObjects/sourceType.valueObject";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import SourceDtoMapper from "@/presentation/http/sources/mappers/Source.mapper";
import { isoDateTimeField } from "@/presentation/http/events/validators/createEvent";
import { strictInput } from "../utils/strictInput";
import { toolError, toolOk } from "../utils/toolResult";

const sourceOutput = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable(),
  type: z.enum(SOURCE_TYPES),
  lastCrawledAt: z.string().nullable(),
});

const listSourcesInput = {
  type: z.enum(SOURCE_TYPES).optional().describe("Tipo de fuente: CRAWLER, COMMUNITY o TEAM. Filtro opcional."),
  search: z.string().trim().max(100).optional().describe("Texto a buscar dentro del nombre de la fuente (opcional, máximo 100)."),
  page: z.number().int().min(1).default(1).describe("Página a devolver, empieza en 1."),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .describe(`Cantidad de fuentes por página (máximo ${MAX_PAGE_SIZE}).`),
};

export function registerSourceTools(server: McpServer, sourceService: ISourceService): void {
  server.registerTool(
    "list_sources",
    {
      title: "Listar fuentes",
      description:
        "Lista las fuentes de información (sitios que se rastrean, la comunidad o el equipo) ordenadas por nombre, con " +
        "filtros opcionales por `type` y texto en el nombre. El `id` de una fuente es el `sourceId` de `create_place` / " +
        "`create_event` y de `mark_source_crawled`. Si `total` es mayor que lo devuelto, pide la siguiente página.",
      inputSchema: strictInput(listSourcesInput),
      outputSchema: {
        data: z.array(sourceOutput),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ type, search, page, pageSize }) => {
      try {
        const result = await sourceService.list(
          { page, pageSize, sort: { field: "name", direction: "asc" } },
          { type, search: search || undefined },
        );
        return toolOk({ ...toPaginatedResponse(result, SourceDtoMapper.toResponse) });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "mark_source_crawled",
    {
      title: "Marcar fuente como rastreada",
      description:
        "Registra que una fuente se rastreó (actualiza su `lastCrawledAt`). Úsala al terminar de procesar una fuente. " +
        "Si no envías `at` se usa el momento actual. Falla si la fuente no existe.",
      inputSchema: strictInput({
        id: z.string().uuid().describe("UUID de la fuente (ver `list_sources`)."),
        at: isoDateTimeField("at")
          .optional()
          .describe("Momento del rastreo en ISO 8601 con zona horaria (ej. 2026-12-01T18:00:00-06:00). Por defecto, ahora."),
      }),
      outputSchema: sourceOutput.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, at }) => {
      try {
        const source = await sourceService.markCrawled(id, at ? new Date(at) : undefined);
        return toolOk({ ...SourceDtoMapper.toResponse(source) });
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
