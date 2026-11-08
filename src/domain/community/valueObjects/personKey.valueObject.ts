import DataException from "@/domain/core/errors/DataError";

/** Device ids sent by guests (`X-Device-Id`): 8-128 chars of letters, digits, `.`, `_`, `:` and `-`. */
export const DEVICE_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

/**
 * Who verified or reported: `user:<id>` for signed-in users, `device:<id>` for guests. One counted
 * verification / one report per person and plan. Stored, never shown.
 */
export class PersonKey {
  private constructor(
    private readonly _value: string,
    private readonly _userId: string | null,
  ) {}

  static forUser(userId: string): PersonKey {
    return new PersonKey(`user:${userId}`, userId);
  }

  static forDevice(deviceId: string): PersonKey {
    if (typeof deviceId !== "string" || !DEVICE_ID_PATTERN.test(deviceId)) {
      throw new DataException("X-Device-Id no es válido (8-128 caracteres: letras, números, '.', '_', ':' o '-')");
    }
    return new PersonKey(`device:${deviceId}`, null);
  }

  get value() { return this._value; }
  /** Null for guests. */
  get userId() { return this._userId; }
  get isGuest() { return this._userId === null; }
}
