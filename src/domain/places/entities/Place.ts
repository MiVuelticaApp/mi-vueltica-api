import { PlaceName } from "../valueObjects/placeName.valueObject";
import { PlaceDescription } from "../valueObjects/placeDescription.valueObject";
import { PlaceAddress } from "../valueObjects/placeAddress.valueObject";
import { Coordinates } from "../valueObjects/coordinates.valueObject";
import { OpeningHours, OpeningHoursValue } from "../valueObjects/openingHours.valueObject";
import { ContentStatus, parseContentStatus } from "../valueObjects/contentStatus.valueObject";
import { TargetAudience, parseTargetAudience } from "../valueObjects/targetAudience.valueObject";

/** Editable fields shared by create and full-replace update (no status). */
export interface PlaceData {
  cantonId: number;
  categoryId: number;
  sourceId?: string | null;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  openingHours?: OpeningHoursValue | null;
  targetAudience?: TargetAudience;
}

/** `PlaceData` after running every field through its value object. */
export interface NormalizedPlaceData {
  cantonId: number;
  categoryId: number;
  sourceId: string | null;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  openingHours: OpeningHoursValue | null;
  targetAudience: TargetAudience;
}

/** Validates and normalizes editable data (trim, empty -> null, defaults). Throws `DataException`. */
export function normalizePlaceData(data: PlaceData): NormalizedPlaceData {
  const coordinates = Coordinates.create(data.latitude, data.longitude);
  return {
    cantonId: data.cantonId,
    categoryId: data.categoryId,
    sourceId: data.sourceId ?? null,
    name: PlaceName.create(data.name).value,
    description: PlaceDescription.create(data.description).value,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    address: PlaceAddress.create(data.address).value,
    openingHours: OpeningHours.create(data.openingHours).value,
    targetAudience: parseTargetAudience(data.targetAudience ?? "EVERYONE"),
  };
}

export class Place {
  private props: PlaceProps;

  constructor(props: PlaceConstructorProps) {
    this.props = {
      id: props.id,
      cantonId: props.cantonId,
      categoryId: props.categoryId,
      sourceId: props.sourceId ?? null,
      name: PlaceName.create(props.name),
      description: PlaceDescription.create(props.description),
      coordinates: Coordinates.create(props.latitude, props.longitude),
      address: PlaceAddress.create(props.address),
      openingHours: OpeningHours.create(props.openingHours),
      targetAudience: parseTargetAudience(props.targetAudience),
      status: parseContentStatus(props.status),
      verifiedAt: props.verifiedAt ?? null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  get id() { return this.props.id; }
  get cantonId() { return this.props.cantonId; }
  get categoryId() { return this.props.categoryId; }
  get sourceId() { return this.props.sourceId; }
  get name() { return this.props.name.value; }
  get description() { return this.props.description.value; }
  get latitude() { return this.props.coordinates.latitude; }
  get longitude() { return this.props.coordinates.longitude; }
  get address() { return this.props.address.value; }
  get openingHours() { return this.props.openingHours.value; }
  get targetAudience() { return this.props.targetAudience; }
  get status() { return this.props.status; }
  get verifiedAt() { return this.props.verifiedAt; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  /** Full replace of the editable fields. Status and verifiedAt are kept. */
  update(data: PlaceData) {
    const normalized = normalizePlaceData(data);
    this.props.cantonId = normalized.cantonId;
    this.props.categoryId = normalized.categoryId;
    this.props.sourceId = normalized.sourceId;
    this.props.name = PlaceName.create(normalized.name);
    this.props.description = PlaceDescription.create(normalized.description);
    this.props.coordinates = Coordinates.create(normalized.latitude, normalized.longitude);
    this.props.address = PlaceAddress.create(normalized.address);
    this.props.openingHours = OpeningHours.create(normalized.openingHours);
    this.props.targetAudience = normalized.targetAudience;
  }

  /**
   * Moves the place to `status`. Transitioning to PUBLISHED stamps `verifiedAt = now`;
   * a place that is already PUBLISHED keeps its existing `verifiedAt`.
   * Any other status leaves `verifiedAt` untouched.
   */
  changeStatus(status: ContentStatus, now: Date) {
    const next = parseContentStatus(status);
    if (next === "PUBLISHED" && (this.props.status !== "PUBLISHED" || this.props.verifiedAt === null)) {
      this.props.verifiedAt = now;
    }
    this.props.status = next;
  }
}

export interface PlaceProps {
  id: string;
  cantonId: number;
  categoryId: number;
  sourceId: string | null;
  name: PlaceName;
  description: PlaceDescription;
  coordinates: Coordinates;
  address: PlaceAddress;
  openingHours: OpeningHours;
  targetAudience: TargetAudience;
  status: ContentStatus;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaceConstructorProps {
  id: string;
  cantonId: number;
  categoryId: number;
  sourceId?: string | null;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  openingHours?: unknown;
  targetAudience: TargetAudience;
  status: ContentStatus;
  verifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
