import z from "zod";
import { AddPhotoSchema } from "../validators/addPhoto";

export type AddPhotoRequest = z.output<typeof AddPhotoSchema>;
