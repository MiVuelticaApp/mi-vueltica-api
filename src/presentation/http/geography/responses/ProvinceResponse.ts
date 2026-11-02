export interface CantonSummaryResponse {
  id: number;
  name: string;
}

export interface ProvinceResponse {
  id: number;
  name: string;
  /** Only present in the list when `?include=cantons` is sent. */
  cantons?: CantonSummaryResponse[];
}
