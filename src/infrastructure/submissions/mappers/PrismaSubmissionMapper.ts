import { Submission, SubmissionCreated } from "@/domain/submissions/entities/Submission";
import { rejectionReasonFromDb } from "./submissionEnums";
import {
  SubmissionEventData,
  SubmissionPayload,
  SubmissionPayloadInput,
  SubmissionPlaceData,
} from "@/domain/submissions/entities/SubmissionPayload";
import { Prisma, Submission as PrismaSubmission } from "@/infrastructure/prisma/generated/prisma/client";

type JsonObject = Record<string, unknown>;

export class PrismaSubmissionMapper {
  static toDomain(row: PrismaSubmission): Submission {
    return new Submission({
      id: row.id,
      userId: row.userId,
      payload: PrismaSubmissionMapper.payloadFromJson(row.type, row.data),
      status: row.status,
      aiScore: row.aiScore,
      aiReason: row.aiReason,
      reviewedById: row.reviewedById,
      reviewedAt: row.reviewedAt,
      reviewNote: row.reviewNote,
      rejectionReason: rejectionReasonFromDb(row.rejectionReason),
      created: PrismaSubmissionMapper.createdFromColumns(row),
      createdAt: row.createdAt,
    });
  }

  /** At most one of the two columns is set (the application writes exactly one on approval). */
  static createdFromColumns(row: Pick<PrismaSubmission, "id" | "createdPlaceId" | "createdEventId">): SubmissionCreated | null {
    if (row.createdPlaceId && row.createdEventId) {
      throw new Error(`Submission ${row.id} must reference at most one created place or event`);
    }
    if (row.createdPlaceId) return { type: "PLACE", id: row.createdPlaceId };
    if (row.createdEventId) return { type: "EVENT", id: row.createdEventId };
    return null;
  }

  static createdToColumns(created: SubmissionCreated | null): { createdPlaceId: string | null; createdEventId: string | null } {
    return {
      createdPlaceId: created?.type === "PLACE" ? created.id : null,
      createdEventId: created?.type === "EVENT" ? created.id : null,
    };
  }

  /** JSON column → typed payload. Event dates are stored as ISO strings. */
  static payloadFromJson(type: PrismaSubmission["type"], data: Prisma.JsonValue): SubmissionPayloadInput {
    const json = (data && typeof data === "object" && !Array.isArray(data) ? data : {}) as JsonObject;
    if (type === "EVENT") {
      return {
        type,
        data: {
          ...json,
          startsAt: new Date(json.startsAt as string),
          endsAt: json.endsAt ? new Date(json.endsAt as string) : null,
        } as SubmissionEventData,
      };
    }
    return { type: "PLACE", data: json as unknown as SubmissionPlaceData };
  }

  /** Typed payload → JSON column. */
  static payloadToJson(payload: SubmissionPayload): Prisma.InputJsonObject {
    if (payload.type === "EVENT") {
      return {
        ...payload.data,
        startsAt: payload.data.startsAt.toISOString(),
        endsAt: payload.data.endsAt ? payload.data.endsAt.toISOString() : null,
      } as Prisma.InputJsonObject;
    }
    return payload.data as unknown as Prisma.InputJsonObject;
  }
}
