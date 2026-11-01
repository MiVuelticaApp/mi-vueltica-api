import { CreateEventSchema } from "./createEvent";

/** PUT is a full replace of the editable fields; status is changed only via PATCH /:id/status. */
export const UpdateEventSchema = CreateEventSchema;
