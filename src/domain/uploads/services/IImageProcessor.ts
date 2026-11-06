/** Longest side of a stored image; larger pictures are scaled down (never up). */
export const MAX_IMAGE_DIMENSION = 2048;

export interface ProcessedImage {
  body: Buffer;
  contentType: string;
  width: number;
  height: number;
}

/**
 * Turns a user-supplied file into the image that is actually stored: checks the real format
 * from its bytes (never the client's Content-Type), applies the EXIF orientation, strips every
 * metadata block (EXIF GPS position, camera serials...) and caps its dimensions.
 * Throws `UnsupportedImageError` (415) when the bytes are not a supported image.
 *
 * @see src/infrastructure/uploads/images/SharpImageProcessor.ts
 */
export interface IImageProcessor {
  process(input: Buffer): Promise<ProcessedImage>;
}
