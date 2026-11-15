import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICategoryService } from "@/application/categories/services/interfaces/ICategoryService";
import { IPlaceService } from "@/application/places/services/interfaces/IPlaceService";
import { IEventService } from "@/application/events/services/interfaces/IEventService";
import { ISourceService } from "@/application/sources/services/interfaces/ISourceService";
import { IPhotoService } from "@/application/photos/services/interfaces/IPhotoService";
import { registerSourceTools } from "../tools/sources.tools";
import { registerPhotoTools } from "../tools/photos.tools";
import { registerCategoryTools } from "../tools/categories.tools";
import { registerPlaceTools } from "../tools/places.tools";
import { registerEventTools } from "../tools/events.tools";

export interface McpServerDependencies {
  categoryService: ICategoryService;
  placeService: IPlaceService;
  eventService: IEventService;
  sourceService: ISourceService;
  photoService: IPhotoService;
}

/** The authenticated caller of the request (set by `jwtAuth` + `requireRole`), for tools that log who did what. */
export interface McpCaller {
  userId: string;
  role: string;
}

export type McpServerFactory = (caller: McpCaller) => McpServer;

/**
 * Single place where every MCP tool is registered. Add new `register*Tools` calls here
 * (and their services to `McpServerDependencies`).
 */
export function createMcpServerFactory(deps: McpServerDependencies): McpServerFactory {
  return (caller) => {
    const server = new McpServer(
      { name: "mi-vueltica", version: "1.0.0" },
      {
        instructions:
          "API de Mi Vueltica (lugares y eventos en Costa Rica). Todos los textos están en español. " +
          "Las herramientas rechazan argumentos desconocidos (error de validación) en vez de ignorarlos. " +
          "`create_place` / `create_event` crean contenido PENDING; se publica con `set_place_status` / `set_event_status`. " +
          "`update_place` / `update_event` reemplazan todos los campos: consulta primero los valores actuales.",
      },
    );

    registerCategoryTools(server, deps.categoryService);
    registerPlaceTools(server, deps.placeService, caller);
    registerEventTools(server, deps.eventService, caller);
    registerSourceTools(server, deps.sourceService);
    registerPhotoTools(server, deps.photoService);

    return server;
  };
}
