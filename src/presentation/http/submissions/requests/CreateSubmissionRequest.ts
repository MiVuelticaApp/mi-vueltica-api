import { SubmissionPayloadInput } from "@/domain/submissions/entities/SubmissionPayload";

/** `{ type: "PLACE", data: <place body without sourceId> } | { type: "EVENT", data: <event body without sourceId> }` */
export type CreateSubmissionRequest = SubmissionPayloadInput;
