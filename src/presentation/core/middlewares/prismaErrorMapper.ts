import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";

export interface MappedError {
  status: number;
  message: string;
}

function fromKnownError(err: Prisma.PrismaClientKnownRequestError): MappedError | null {
  switch (err.code) {
    case "P2002": {
      // Only column names from the error metadata, never the conflicting values.
      const target = err.meta?.target;
      const fields = Array.isArray(target) && target.every((t) => typeof t === "string") ? target : [];
      return {
        status: 409,
        message: fields.length ? `El recurso ya existe (${fields.join(", ")})` : "El recurso ya existe",
      };
    }
    case "P2003":
      return { status: 409, message: "Operación no permitida: el recurso está relacionado con otros registros" };
    case "P2025":
      return { status: 404, message: "Recurso no encontrado" };
    default:
      return null;
  }
}

/**
 * Maps known Prisma request errors to an HTTP status/message. Also inspects `err.cause`
 * so errors wrapped by repositories (DatabaseError(..., error)) are mapped too.
 * Returns null for anything unrecognised (falls through to the generic handling).
 */
export function mapPrismaError(err: unknown): MappedError | null {
  for (let current: unknown = err, depth = 0; current && depth < 5; depth++) {
    if (current instanceof Prisma.PrismaClientKnownRequestError) return fromKnownError(current);
    current = current instanceof Error ? current.cause : undefined;
  }
  return null;
}
