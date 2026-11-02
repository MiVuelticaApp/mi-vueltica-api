import { Province } from "./Province";

/** Minimal canton data nested in a province listing (`?include=cantons`). */
export interface CantonSummary {
  id: number;
  name: string;
}

/**
 * Read model for the province list: the province plus, only when requested, its cantons
 * ordered by id. `cantons` is undefined when they were not requested.
 */
export interface ProvinceListItem {
  province: Province;
  cantons?: CantonSummary[];
}
