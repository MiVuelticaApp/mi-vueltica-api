/** Geographic list filters shared by places and events. `bbox` and `radius` are mutually exclusive. */
export interface BoundingBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface RadiusFilter {
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface GeoFilters {
  /** Mutually exclusive with `radius`. */
  bbox?: BoundingBox;
  /** Mutually exclusive with `bbox`. */
  radius?: RadiusFilter;
}
