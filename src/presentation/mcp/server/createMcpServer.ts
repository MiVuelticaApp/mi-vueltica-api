import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICategoryService } from "@/application/categories/services/interfaces/ICategoryService";
import { IPlaceService } from "@/application/places/services/interfaces/IPlaceService";
import { IEventService } from "@/application/events/services/interfaces/IEventService";
import { registerCategoryTools } from "../tools/categories.tools";
import { registerPlaceTools } from "../tools/places.tools";
import { registerEventTools } from "../tools/events.tools";

export interface McpServerDependencies {
  categoryService: ICategoryService;
  placeService: IPlaceService;
  eventService: IEventService;
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
    registerPlaceTools(server, deps.placeService);
    registerEventTools(server, deps.eventService);

    return server;
  };
}
