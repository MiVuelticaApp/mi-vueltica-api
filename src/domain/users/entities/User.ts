import { UserId } from "@/domain/users/valueObjects/userId.valueObject";
import { Email } from "../valueObjects/email.valueObject";

// Mirror the Prisma enums so the domain never depends on the generated client.
export const SSO_PROVIDERS = ["GOOGLE", "APPLE"] as const;
export type SsoProvider = (typeof SSO_PROVIDERS)[number];

export const USER_ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AGE_RANGES = ["AGE_18_25", "AGE_26_35", "AGE_36_50", "AGE_51_64", "AGE_65_PLUS"] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

export class User {
  private props: UserProps;
  constructor(props: UserConstructorProps) {
    this.props = {
      id: UserId.create(props.id),
      name: props.name,
      surnames: props.surnames,
      email: Email.create(props.email),
      ssoProvider: props.ssoProvider,
      ssoSubject: props.ssoSubject,
      ageRange: props.ageRange ?? null,
      role: props.role ?? "USER",
      deletedAt: props.deletedAt ? new Date(props.deletedAt) : null,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };
  }

  set id (value: string) { this.props.id = UserId.create(value);}
  get id() { return this.props.id.value; }
  get name() { return this.props.name; }
  get surnames() { return this.props.surnames; }
  get email() { return this.props.email; }
  get ssoProvider() { return this.props.ssoProvider; }
  get ssoSubject() { return this.props.ssoSubject; }
  get ageRange() { return this.props.ageRange; }
  get role() { return this.props.role; }
  get deletedAt() { return this.props.deletedAt; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  // Only the user-editable fields. Email and SSO identity come from the provider and never change here.
  updateProfile(changes: UserProfileChanges) {
    this.props.name = changes.name;
    this.props.surnames = changes.surnames;
    if (changes.ageRange !== undefined) this.props.ageRange = changes.ageRange;
    this.props.updatedAt = new Date();
  }

  changeRole(role: UserRole) {
    this.props.role = role;
    this.props.updatedAt = new Date();
  }
}


export interface UserProps {
  id: UserId;
  name: string;
  surnames: string;
  email: Email;
  ssoProvider: SsoProvider;
  ssoSubject: string;
  ageRange: AgeRange | null;
  role: UserRole;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserConstructorProps {
  id: string;
  name: string;
  surnames: string;
  email: string;
  ssoProvider: SsoProvider;
  ssoSubject: string;
  ageRange?: AgeRange | null;
  role?: UserRole;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileChanges {
  name: string;
  surnames: string;
  ageRange?: AgeRange | null;
}
