import { UserId } from "@/domain/users/valueObjects/userId.valueObject";
import { Email } from "../valueObjects/email.valueObject";

export class User {
  private props: UserProps;
  constructor(props: UserConstructorProps) {
    this.props = {
      id: UserId.create(props.id),
      name: props.name,
      surnames: props.surnames,
      email: Email.create(props.email),
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };
  }

  set id (value: string) { this.props.id = UserId.create(value);}
  get id() { return this.props.id.value; }
  get name() { return this.props.name; }
  get surnames() { return this.props.surnames; }
  get email() { return this.props.email; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}


export interface UserProps {
  id: UserId;
  name: string;
  surnames: string;
  email: Email;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserConstructorProps {
  id: string;
  name: string;
  surnames: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
