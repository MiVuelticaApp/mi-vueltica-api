import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICategoryService } from "@/application/categories/services/interfaces/ICategoryService";
import { MAX_PAGE_SIZE } from "@/domain/core/pagination/Pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import CategoryDtoMapper from "@/presentation/http/categories/mappers/Category.mapper";
import { toolError, toolOk } from "../utils/toolResult";

const listCategoriesInput = {
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .describe("Texto a buscar dentro del nombre de la categoría (opcional)."),
  page: z.number().int().min(1).default(1).describe("Página a devolver, empieza en 1."),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(MAX_PAGE_SIZE)
    .describe(`Cantidad de categorías por página (máximo ${MAX_PAGE_SIZE}).`),
};

const listCategoriesOutput = {
  data: z.array(z.object({ id: z.number().int(), name: z.string() })),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
};

export function registerCategoryTools(server: McpServer, categoryService: ICategoryService): void {
  server.registerTool(
    "list_categories",
    {
      title: "Listar categorías",
      description:
        "Lista las categorías de Mi Vueltica ordenadas por nombre. Usa el `id` de una categoría como " +
        "`categoryId` al buscar o crear eventos y lugares. Si `total` es mayor que lo devuelto, pide la " +
        "siguiente página.",
      inputSchema: listCategoriesInput,
      outputSchema: listCategoriesOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ search, page, pageSize }) => {
      try {
        const result = await categoryService.list(
          { page, pageSize, sort: { field: "name", direction: "asc" } },
          { search: search || undefined },
        );
        return toolOk({ ...toPaginatedResponse(result, CategoryDtoMapper.toResponse) });
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
