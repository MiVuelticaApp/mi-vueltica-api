import z from "zod";
import { ReorderPhotosSchema } from "../validators/reorderPhotos";

export type ReorderPhotosRequest = z.output<typeof ReorderPhotosSchema>;
