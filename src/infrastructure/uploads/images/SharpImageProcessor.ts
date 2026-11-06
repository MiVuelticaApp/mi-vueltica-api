import sharp from "sharp";
import { IImageProcessor, MAX_IMAGE_DIMENSION, ProcessedImage } from "@/domain/uploads/services/IImageProcessor";
import { UnsupportedImageError } from "@/domain/uploads/errors/UnsupportedImageError";

/** Decompression-bomb guard: inputs above this many pixels are rejected before decoding. */
const MAX_INPUT_PIXELS = 50_000_000;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);
const OUTPUT_CONTENT_TYPE = "image/jpeg";
const JPEG_QUALITY = 82;

/**
 * Every upload is re-encoded with sharp/libvips, which is what makes it safe to serve:
 * - the format is detected from the bytes (the client's Content-Type is ignored);
 * - the EXIF orientation is applied, then ALL metadata (GPS position, camera serials...) is
 *   dropped, since sharp writes none unless asked to;
 * - transparency is flattened on white and the result is a JPEG of at most 2048 px per side,
 *   so every stored photo has one predictable, widely supported format.
 */
export default class SharpImageProcessor implements IImageProcessor {
  async process(input: Buffer): Promise<ProcessedImage> {
    let format: string | undefined;
    try {
      format = (await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata()).format;
    } catch {
      throw new UnsupportedImageError();
    }
    if (format === "heif") {
      throw new UnsupportedImageError("Las imágenes HEIC/AVIF no se admiten: envía la foto como JPEG, PNG o WebP");
    }
    if (!format || !ACCEPTED_FORMATS.has(format)) throw new UnsupportedImageError();

    try {
      const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
        .rotate()
        .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
      return { body: data, contentType: OUTPUT_CONTENT_TYPE, width: info.width, height: info.height };
    } catch {
      throw new UnsupportedImageError("La imagen está dañada o es demasiado grande");
    }
  }
}
