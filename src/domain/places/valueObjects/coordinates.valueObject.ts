import DataException from "@/domain/core/errors/DataError";

export const MIN_LATITUDE = -90;
export const MAX_LATITUDE = 90;
export const MIN_LONGITUDE = -180;
export const MAX_LONGITUDE = 180;

export class Coordinates {
  private constructor(
    private readonly _latitude: number,
    private readonly _longitude: number,
  ) {}

  static create(latitude: number, longitude: number) {
    if (typeof latitude !== "number" || !Number.isFinite(latitude) || latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
      throw new DataException(`La latitud debe estar entre ${MIN_LATITUDE} y ${MAX_LATITUDE}`);
    }
    if (typeof longitude !== "number" || !Number.isFinite(longitude) || longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
      throw new DataException(`La longitud debe estar entre ${MIN_LONGITUDE} y ${MAX_LONGITUDE}`);
    }
    return new Coordinates(latitude, longitude);
  }

  get latitude() {
    return this._latitude;
  }

  get longitude() {
    return this._longitude;
  }
}
