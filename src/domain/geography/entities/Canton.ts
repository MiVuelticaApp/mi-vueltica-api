import { CantonName } from "../valueObjects/cantonName.valueObject";
import { assertCantonIdMatchesProvince } from "../valueObjects/cantonId.valueObject";

/**
 * A Costa Rica canton. The id is the official INEC code (`provinceId * 100 + cantonNumber`):
 * it is always provided by the client, never generated, and it is immutable.
 */
export class Canton {
  private props: CantonProps;

  constructor(props: CantonConstructorProps) {
    assertCantonIdMatchesProvince(props.id, props.provinceId);
    this.props = {
      id: props.id,
      provinceId: props.provinceId,
      name: CantonName.create(props.name),
    };
  }

  get id() { return this.props.id; }
  get provinceId() { return this.props.provinceId; }
  get name() { return this.props.name.value; }

  rename(name: string) {
    this.props.name = CantonName.create(name);
  }
}

export interface CantonProps {
  id: number;
  provinceId: number;
  name: CantonName;
}

export interface CantonConstructorProps {
  id: number;
  provinceId: number;
  name: string;
}
