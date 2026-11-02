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

// MariaDB "Record has changed since last read in table '...'; try restarting transaction".
// With MariaDB 11's innodb_snapshot_isolation, two requests updating the same row at the same
// time make all but one fail with this error (Prisma's `update` reads the row and then writes
// it). Nothing is corrupted: one write wins and the others are rejected, so it is a conflict
// the client can retry, not a server error.
const MARIADB_RECORD_CHANGED = 1020;

/**
 * Database errors that Prisma does not translate to a P-code reach us as a `DriverAdapterError`
 * whose `cause` is the raw driver error `{ kind: "mysql", code, message, state }` (a plain
 * object, not an Error). Checked by shape because the class lives in
 * `@prisma/driver-adapter-utils`, which is not a direct dependency.
 */
function fromDriverAdapterError(err: Error): MappedError | null {
  if (err.name !== "DriverAdapterError") return null;
  const cause = err.cause as { kind?: unknown; code?: unknown } | undefined;
  if (cause?.kind === "mysql" && cause.code === MARIADB_RECORD_CHANGED) {
    return {
      status: 409,
      message: "El recurso fue modificado por otra solicitud al mismo tiempo; intenta de nuevo",
    };
  }
  return null;
}

/**
 * Maps known Prisma request errors (and the MariaDB "record has changed" error) to an HTTP
 * status/message. Also inspects `err.cause` so errors wrapped by repositories
 * (DatabaseError(..., error)) are mapped too.
 * Returns null for anything unrecognised (falls through to the generic handling).
 */
export function mapPrismaError(err: unknown): MappedError | null {
  for (let current: unknown = err, depth = 0; current && depth < 5; depth++) {
    if (current instanceof Prisma.PrismaClientKnownRequestError) return fromKnownError(current);
    if (current instanceof Error) {
      const mapped = fromDriverAdapterError(current);
      if (mapped) return mapped;
    }
    current = current instanceof Error ? current.cause : undefined;
  }
  return null;
}
