import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICategoryService } from "@/application/categories/services/interfaces/ICategoryService";
import { registerCategoryTools } from "../tools/categories.tools";

export interface McpServerDependencies {
  categoryService: ICategoryService;
}

export type McpServerFactory = () => McpServer;

/**
 * Single place where every MCP tool is registered. Add new `register*Tools` calls here
 * (and their services to `McpServerDependencies`).
 */
export function createMcpServerFactory(deps: McpServerDependencies): McpServerFactory {
  return () => {
    const server = new McpServer(
      { name: "mi-vueltica", version: "1.0.0" },
      {
        instructions:
          "API de Mi Vueltica (lugares y eventos en Costa Rica). Todos los textos están en español.",
      },
    );

    registerCategoryTools(server, deps.categoryService);

    return server;
  };
}
