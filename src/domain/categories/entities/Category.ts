import { CategoryName } from "../valueObjects/categoryName.valueObject";

export class Category {
  private props: CategoryProps;

  constructor(props: CategoryConstructorProps) {
    this.props = {
      id: props.id,
      name: CategoryName.create(props.name),
    };
  }

  get id() { return this.props.id; }
  get name() { return this.props.name.value; }

  rename(name: string) {
    this.props.name = CategoryName.create(name);
  }
}

export interface CategoryProps {
  id: number;
  name: CategoryName;
}

export interface CategoryConstructorProps {
  id: number;
  name: string;
}
