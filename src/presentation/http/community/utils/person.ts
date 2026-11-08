import { Request } from "express";
import DataException from "@/domain/core/errors/DataError";
import { PersonKey } from "@/domain/community/valueObjects/personKey.valueObject";

/** Header guests send so their verifications / reports are deduplicated per device. */
export const DEVICE_ID_HEADER = "x-device-id";

/**
 * The caller as a verifier / reporter: the signed-in user (set by `optionalJwtAuth`), else the guest's
 * device (`X-Device-Id`). An invalid header is a 400; no user and no header is null.
 */
export function personFromRequest(req: Request): PersonKey | null {
  if (req.user) return PersonKey.forUser(req.user.id);
  const deviceId = req.get(DEVICE_ID_HEADER);
  return deviceId === undefined ? null : PersonKey.forDevice(deviceId.trim());
}

/** Same, for writes: someone has to be identified. */
export function requirePerson(req: Request): PersonKey {
  const person = personFromRequest(req);
  if (!person) throw new DataException("Iniciá sesión o enviá el encabezado X-Device-Id");
  return person;
}

/** For reads (detail endpoints): a malformed header is ignored instead of failing the request. */
export function optionalPerson(req: Request): PersonKey | null {
  try {
    return personFromRequest(req);
  } catch {
    return null;
  }
}
