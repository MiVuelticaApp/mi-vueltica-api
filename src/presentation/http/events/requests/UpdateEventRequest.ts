import { CreateEventRequest } from "./CreateEventRequest";

/** Full replace of the editable fields; status is not part of the body. */
export type UpdateEventRequest = CreateEventRequest;
