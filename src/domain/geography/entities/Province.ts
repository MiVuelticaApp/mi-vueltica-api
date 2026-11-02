import { ProvinceName } from "../valueObjects/provinceName.valueObject";

/**
 * A Costa Rica province. The id is the official INEC province code (1-7): it is always
 * provided by the client, never generated.
 */
export class Province {
  private props: ProvinceProps;

  constructor(props: ProvinceConstructorProps) {
    this.props = {
      id: props.id,
      name: ProvinceName.create(props.name),
    };
  }

  get id() { return this.props.id; }
  get name() { return this.props.name.value; }

  rename(name: string) {
    this.props.name = ProvinceName.create(name);
  }
}

export interface ProvinceProps {
  id: number;
  name: ProvinceName;
}

export interface ProvinceConstructorProps {
  id: number;
  name: string;
}
