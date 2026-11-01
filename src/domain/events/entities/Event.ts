import { EventTitle } from "../valueObjects/eventTitle.valueObject";
import { EventDescription } from "../valueObjects/eventDescription.valueObject";
import { EventSchedule } from "../valueObjects/eventSchedule.valueObject";
import { ContentStatus, parseContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { TargetAudience, parseTargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";

/** Editable fields shared by create and full-replace update (no status). */
export interface EventData {
  placeId?: string | null;
  categoryId: number;
  sourceId?: string | null;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  targetAudience?: TargetAudience;
}

/** `EventData` after running every field through its value object. */
export interface NormalizedEventData {
  placeId: string | null;
  categoryId: number;
  sourceId: string | null;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  targetAudience: TargetAudience;
}

/** Validates and normalizes editable data (trim, empty -> null, defaults). Throws `DataException`. */
export function normalizeEventData(data: EventData): NormalizedEventData {
  const schedule = EventSchedule.create(data.startsAt, data.endsAt);
  return {
    placeId: data.placeId ?? null,
    categoryId: data.categoryId,
    sourceId: data.sourceId ?? null,
    title: EventTitle.create(data.title).value,
    description: EventDescription.create(data.description).value,
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    targetAudience: parseTargetAudience(data.targetAudience ?? "EVERYONE"),
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
      targetAudience: parseTargetAudience(props.targetAudience),
      status: parseContentStatus(props.status),
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
  get targetAudience() { return this.props.targetAudience; }
  get status() { return this.props.status; }
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
    this.props.targetAudience = normalized.targetAudience;
  }

  changeStatus(status: ContentStatus) {
    this.props.status = parseContentStatus(status);
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
  targetAudience: TargetAudience;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventConstructorProps {
  id: string;
  placeId?: string | null;
  categoryId: number;
  sourceId?: string | null;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  targetAudience: TargetAudience;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}
