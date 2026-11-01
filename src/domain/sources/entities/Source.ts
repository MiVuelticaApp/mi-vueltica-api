import { SourceName } from "../valueObjects/sourceName.valueObject";
import { SourceUrl } from "../valueObjects/sourceUrl.valueObject";
import { SourceType, parseSourceType } from "../valueObjects/sourceType.valueObject";

export class Source {
  private props: SourceProps;

  constructor(props: SourceConstructorProps) {
    this.props = {
      id: props.id,
      name: SourceName.create(props.name),
      url: SourceUrl.create(props.url),
      type: parseSourceType(props.type),
      lastCrawledAt: props.lastCrawledAt ?? null,
    };
  }

  get id() { return this.props.id; }
  get name() { return this.props.name.value; }
  get url() { return this.props.url.value; }
  get type() { return this.props.type; }
  get lastCrawledAt() { return this.props.lastCrawledAt; }

  update(data: { name: string; url?: string | null; type: SourceType }) {
    const name = SourceName.create(data.name);
    const url = SourceUrl.create(data.url);
    const type = parseSourceType(data.type);
    this.props.name = name;
    this.props.url = url;
    this.props.type = type;
  }

  markCrawled(at: Date) {
    this.props.lastCrawledAt = at;
  }

  setLastCrawledAt(at: Date | null) {
    this.props.lastCrawledAt = at;
  }
}

export interface SourceProps {
  id: string;
  name: SourceName;
  url: SourceUrl;
  type: SourceType;
  lastCrawledAt: Date | null;
}

export interface SourceConstructorProps {
  id: string;
  name: string;
  url?: string | null;
  type: SourceType;
  lastCrawledAt?: Date | null;
}
