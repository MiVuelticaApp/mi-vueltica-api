import { Request, Response } from "express";
import { pipeline } from "stream/promises";
import { IUploadService } from "@/application/uploads/services/interfaces/IUploadService";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";

type IdParams = { id: string };

/** A file never changes once uploaded (a new picture is a new upload). */
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

/**
 * GET /files/:id — proxies a file from MinIO. Public: the random v4 id is the capability, so
 * the app can use the URL directly in <Image>. The bucket itself is never exposed.
 */
export default class FileController {
  constructor(private readonly uploadService: IUploadService) {}

  async get(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const info = await this.uploadService.getFileInfo(id);

    res.set({
      "Cache-Control": IMMUTABLE_CACHE,
      ETag: `"${info.etag}"`,
      "Last-Modified": info.lastModified.toUTCString(),
      // Served bytes are always a re-encoded image, but never let a browser sniff or run them.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cross-Origin-Resource-Policy": "cross-origin",
    });

    // Conditional request (If-None-Match / If-Modified-Since) against the headers set above.
    if (req.fresh) {
      res.status(304).end();
      return;
    }

    res.type(info.contentType);
    res.set("Content-Length", String(info.size));
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    const stream = await this.uploadService.openFile(id);
    try {
      await pipeline(stream, res);
    } catch (error) {
      // Headers are already sent: the only thing left is to cut the connection. A client that
      // simply went away is not worth logging.
      if (!res.writableEnded && (error as NodeJS.ErrnoException).code !== "ERR_STREAM_PREMATURE_CLOSE") {
        console.error(`[files] error streaming ${id}:`, error);
      }
      res.destroy();
    }
  }
}
