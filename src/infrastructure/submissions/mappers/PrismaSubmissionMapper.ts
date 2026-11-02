import { Submission } from "@/domain/submissions/entities/Submission";
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
      createdAt: row.createdAt,
    });
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
