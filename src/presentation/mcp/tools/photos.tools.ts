import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IPhotoService } from "@/application/photos/services/interfaces/IPhotoService";
import { PhotoOwner } from "@/domain/photos/valueObjects/photoOwner.valueObject";
import { PHOTO_URL_MAX_LENGTH } from "@/domain/photos/valueObjects/photoUrl.valueObject";
import PhotoDtoMapper from "@/presentation/http/photos/mappers/Photo.mapper";
import { AddPhotoSchema } from "@/presentation/http/photos/validators/addPhoto";
import { strictInput } from "../utils/strictInput";
import { toolError, toolOk } from "../utils/toolResult";

const photoOutput = {
  id: z.string(),
  placeId: z.string().nullable(),
  eventId: z.string().nullable(),
  url: z.string(),
  position: z.number().int(),
  createdAt: z.string(),
};

const urlInput = AddPhotoSchema.shape.url.describe(
  `URL de la foto: https externa (máximo ${PHOTO_URL_MAX_LENGTH} caracteres) o una URL de archivo propia de la API.`,
);

export function registerPhotoTools(server: McpServer, photoService: IPhotoService): void {
  const register = (name: "add_place_photo" | "add_event_photo", owner: "PLACE" | "EVENT") => {
    const isPlace = owner === "PLACE";
    const idKey = isPlace ? "placeId" : "eventId";
    server.registerTool(
      name,
      {
        title: isPlace ? "Agregar foto a un lugar" : "Agregar foto a un evento",
        description:
          `Agrega una foto al final de la galería de un ${isPlace ? "lugar" : "evento"} (equivale a ` +
          `\`POST /${isPlace ? "places/:placeId" : "events/:eventId"}/photos\`). La \`url\` debe ser https o un archivo propio de la API. ` +
          `Falla si el ${isPlace ? "lugar" : "evento"} no existe. No es idempotente: repetir la llamada agrega la foto otra vez, ` +
          "así que revisa antes la galería (`coverPhotoUrl` en las listas). El orden se cambia con la API REST.",
        inputSchema: strictInput({
          [idKey]: z.string().uuid().describe(isPlace ? "UUID del lugar (ver `search_places`)." : "UUID del evento (ver `search_events`)."),
          url: urlInput,
        }),
        outputSchema: photoOutput,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      },
      async (args: Record<string, string>) => {
        try {
          const ownerRef: PhotoOwner = { type: owner, id: args[idKey] };
          const photo = await photoService.add(ownerRef, args.url);
          return toolOk({ ...PhotoDtoMapper.toResponse(photo) });
        } catch (error) {
          return toolError(error);
        }
      },
    );
  };

  register("add_place_photo", "PLACE");
  register("add_event_photo", "EVENT");
}
