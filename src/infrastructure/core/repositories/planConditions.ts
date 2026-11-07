import {
  Audience,
  FreeForGroup,
  PRICE_TIER_LIMITS,
  PlanConditionsFilters,
  PlanConditionsValue,
} from "@/domain/places/valueObjects/planConditions.valueObject";

/**
 * `Place` and `Event` store the plan conditions in the same columns (one boolean per group, so
 * every filter is a plain indexed-friendly comparison instead of a JSON search). These helpers map
 * them in both directions and build the list filters for either table.
 */
export interface PlanConditionsColumns {
  pricePerPerson: number | null;
  freeForStudents: boolean;
  freeForSeniors: boolean;
  audienceEveryone: boolean;
  audienceFamilies: boolean;
  audienceStudents: boolean;
  audienceSeniors: boolean;
  wheelchairAccessible: boolean;
}

export function planConditionsFromColumns(row: PlanConditionsColumns): PlanConditionsValue {
  const freeFor: FreeForGroup[] = [];
  if (row.freeForStudents) freeFor.push("estudiantes");
  if (row.freeForSeniors) freeFor.push("ciudadanosOro");

  const audiences: Audience[] = [];
  if (row.audienceEveryone) audiences.push("todo");
  if (row.audienceFamilies) audiences.push("familias");
  if (row.audienceStudents) audiences.push("estudiantes");
  if (row.audienceSeniors) audiences.push("ciudadanosOro");

  return {
    pricePerPerson: row.pricePerPerson,
    freeFor,
    // A row with every audience flag off (only possible through manual SQL) reads as "everyone".
    audiences: audiences.length > 0 ? audiences : ["todo"],
    wheelchair: row.wheelchairAccessible,
  };
}

export function planConditionsToColumns(value: PlanConditionsValue): PlanConditionsColumns {
  return {
    pricePerPerson: value.pricePerPerson,
    freeForStudents: value.freeFor.includes("estudiantes"),
    freeForSeniors: value.freeFor.includes("ciudadanosOro"),
    audienceEveryone: value.audiences.includes("todo"),
    audienceFamilies: value.audiences.includes("familias"),
    audienceStudents: value.audiences.includes("estudiantes"),
    audienceSeniors: value.audiences.includes("ciudadanosOro"),
    wheelchairAccessible: value.wheelchair,
  };
}

/** A where-clause fragment valid for both `Prisma.PlaceWhereInput` and `Prisma.EventWhereInput`. */
type ColumnsWhere = {
  pricePerPerson?: { lte: number } | null;
  OR?: ColumnsWhere[];
} & Partial<Omit<PlanConditionsColumns, "pricePerPerson">>;

/**
 * Conditions to AND into the list query. Mirrors the app's `matchesFilters`:
 * - `maxPrice`: `pricePerPerson <= tier limit`; for `hasta5000` an unknown price (NULL) also
 *   matches, because the app treats it as that tier.
 * - `students` / `seniors`: the group is in the audiences **or** enters free.
 * - `families`: in the audiences. `wheelchair`: accessible.
 * `false` / omitted booleans do not filter.
 */
export function planConditionsWhere(filters: PlanConditionsFilters): ColumnsWhere[] {
  const and: ColumnsWhere[] = [];

  if (filters.maxPrice) {
    const limit = PRICE_TIER_LIMITS[filters.maxPrice];
    and.push(
      filters.maxPrice === "hasta5000"
        ? { OR: [{ pricePerPerson: { lte: limit } }, { pricePerPerson: null }] }
        : { pricePerPerson: { lte: limit } },
    );
  }
  if (filters.students) and.push({ OR: [{ audienceStudents: true }, { freeForStudents: true }] });
  if (filters.seniors) and.push({ OR: [{ audienceSeniors: true }, { freeForSeniors: true }] });
  if (filters.families) and.push({ audienceFamilies: true });
  if (filters.wheelchair) and.push({ wheelchairAccessible: true });

  return and;
}
