import { BoundingBox, RadiusFilter } from "@/domain/core/geo/GeoFilters";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";

const KM_PER_DEGREE = 111.32;
const EARTH_RADIUS_KM = 6371;

/**
 * Smallest latitude/longitude box that contains the circle. Used as a prefilter that can use a
 * (latitude, longitude) index before the exact distance check. No antimeridian wrap-around.
 */
export function boundingBoxAround({ lat, lng, radiusKm }: RadiusFilter): BoundingBox {
  const deltaLat = radiusKm / KM_PER_DEGREE;
  const minLat = Math.max(-90, lat - deltaLat);
  const maxLat = Math.min(90, lat + deltaLat);
  // Near the poles a degree of longitude shrinks to nothing: drop the longitude bounds there.
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const deltaLng = cosLat < 1e-6 ? 360 : radiusKm / (KM_PER_DEGREE * cosLat);
  const minLng = deltaLng >= 180 ? -180 : lng - deltaLng;
  const maxLng = deltaLng >= 180 ? 180 : lng + deltaLng;
  return { minLat, minLng, maxLat, maxLng };
}

/**
 * SQL condition "the point (`latColumn`, `lngColumn`) is in the circle": bounding box prefilter plus the
 * great-circle distance (spherical law of cosines, Earth radius 6371 km; `LEAST`/`GREATEST` keep
 * rounding errors inside `ACOS`'s domain). The columns are trusted identifiers written by the caller
 * (`Prisma.raw`); every value is a bound parameter.
 */
export function withinRadiusSql(latColumn: string, lngColumn: string, radius: RadiusFilter): Prisma.Sql {
  const box = boundingBoxAround(radius);
  const lat = Prisma.raw(latColumn);
  const lng = Prisma.raw(lngColumn);
  return Prisma.sql`${lat} BETWEEN ${box.minLat} AND ${box.maxLat}
    AND ${lng} BETWEEN ${box.minLng} AND ${box.maxLng}
    AND ${EARTH_RADIUS_KM} * ACOS(LEAST(1, GREATEST(-1,
          COS(RADIANS(${radius.lat})) * COS(RADIANS(${lat})) * COS(RADIANS(${lng}) - RADIANS(${radius.lng}))
          + SIN(RADIANS(${radius.lat})) * SIN(RADIANS(${lat}))
        ))) <= ${radius.radiusKm}`;
}
