import { EventTitle } from "../valueObjects/eventTitle.valueObject";
import { EventDescription } from "../valueObjects/eventDescription.valueObject";
import { EventSchedule } from "../valueObjects/eventSchedule.valueObject";
import { ContentStatus, parseContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { TargetAudience, parseTargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { PlanCommunity, PlanCommunityProps } from "@/domain/community/valueObjects/planCommunity.valueObject";
import { PlanConditions, PlanConditionsData, PlanConditionsValue } from "@/domain/places/valueObjects/planConditions.valueObject";
import { EventLocationValue, normalizeEventLocation } from "../valueObjects/eventLocation.valueObject";

/** Editable fields shared by create and full-replace update (no status). */
export interface EventData extends PlanConditionsData {
  placeId?: string | null;
  categoryId: number;
  sourceId?: string | null;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  targetAudience?: TargetAudience;
  /**
   * The event's own location, only for events without a place (a street fair, a concert in a park).
   * `latitude` and `longitude` go together; `address` needs them. With a `placeId` they must be absent.
   */
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

/** `EventData` after running every field through its value object. */
export interface NormalizedEventData extends PlanConditionsValue {
  placeId: string | null;
  categoryId: number;
  sourceId: string | null;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  targetAudience: TargetAudience;
  /** Own location, kept flat: submissions store this object as JSON and normalize it again on read. */
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

/** Validates and normalizes editable data (trim, empty -> null, defaults). Throws `DataException`. */
export function normalizeEventData(data: EventData): NormalizedEventData {
  const schedule = EventSchedule.create(data.startsAt, data.endsAt);
  const location = normalizeEventLocation(data);
  return {
    placeId: data.placeId ?? null,
    categoryId: data.categoryId,
    sourceId: data.sourceId ?? null,
    title: EventTitle.create(data.title).value,
    description: EventDescription.create(data.description).value,
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    targetAudience: parseTargetAudience(data.targetAudience ?? "EVERYONE"),
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    address: location?.address ?? null,
    ...PlanConditions.create(data).value,
  };
}

export class Event {
  private props: EventProps;

  constructor(props: EventConstructorProps) {
    this.props = {
      id: props.id,
      placeId: props.placeId ?? null,
      categoryId: props.categoryId,
      sourceId: props.sourceId ?? null,
      title: EventTitle.create(props.title),
      description: EventDescription.create(props.description),
      schedule: EventSchedule.create(props.startsAt, props.endsAt),
      // Lenient on read: a row with a place never carries its own point (the place's is used), so a
      // hand-edited row with both cannot break every list. Writes go through the strict `normalizeEventData`.
      location: props.placeId ? null : normalizeEventLocation(props),
      targetAudience: parseTargetAudience(props.targetAudience),
      conditions: PlanConditions.create(props),
      status: parseContentStatus(props.status),
      community: PlanCommunity.create(props),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  get id() { return this.props.id; }
  get placeId() { return this.props.placeId; }
  get categoryId() { return this.props.categoryId; }
  get sourceId() { return this.props.sourceId; }
  get title() { return this.props.title.value; }
  get description() { return this.props.description.value; }
  get startsAt() { return this.props.schedule.startsAt; }
  get endsAt() { return this.props.schedule.endsAt; }
  /** The event's own location: null when it has a place or no location at all (see `resolveEventLocation`). */
  get location() { return this.props.location; }
  get targetAudience() { return this.props.targetAudience; }
  get pricePerPerson() { return this.props.conditions.value.pricePerPerson; }
  get priceTier() { return this.props.conditions.priceTier; }
  get freeFor() { return this.props.conditions.value.freeFor; }
  get audiences() { return this.props.conditions.value.audiences; }
  get wheelchair() { return this.props.conditions.value.wheelchair; }
  get status() { return this.props.status; }
  get authorId() { return this.props.community.authorId; }
  get hiddenReason() { return this.props.community.hiddenReason; }
  get reportedAt() { return this.props.community.reportedAt; }

  isAuthoredBy(userId: string): boolean {
    return this.props.community.isAuthoredBy(userId);
  }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  /** Full replace of the editable fields. Status is kept. */
  update(data: EventData) {
    const normalized = normalizeEventData(data);
    this.props.placeId = normalized.placeId;
    this.props.categoryId = normalized.categoryId;
    this.props.sourceId = normalized.sourceId;
    this.props.title = EventTitle.create(normalized.title);
    this.props.description = EventDescription.create(normalized.description);
    this.props.schedule = EventSchedule.create(normalized.startsAt, normalized.endsAt);
    this.props.location = normalizeEventLocation(normalized);
    this.props.targetAudience = normalized.targetAudience;
    this.props.conditions = PlanConditions.create(normalized);
  }

  /** Leaving ARCHIVED clears `hiddenReason` / `reportedAt`. */
  changeStatus(status: ContentStatus) {
    const next = parseContentStatus(status);
    this.props.status = next;
    this.props.community = this.props.community.afterStatusChange(next);
  }
}

export interface EventProps {
  id: string;
  placeId: string | null;
  categoryId: number;
  sourceId: string | null;
  title: EventTitle;
  description: EventDescription;
  schedule: EventSchedule;
  location: EventLocationValue | null;
  targetAudience: TargetAudience;
  conditions: PlanConditions;
  status: ContentStatus;
  community: PlanCommunity;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventConstructorProps extends PlanCommunityProps {
  id: string;
  placeId?: string | null;
  categoryId: number;
  sourceId?: string | null;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  targetAudience: TargetAudience;
  pricePerPerson: number | null;
  freeFor: PlanConditionsValue["freeFor"];
  audiences: PlanConditionsValue["audiences"];
  wheelchair: boolean;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}
