import { PushToken } from "../valueObjects/pushToken.valueObject";
import { Platform, parsePlatform } from "../valueObjects/platform.valueObject";

/**
 * A phone registered to receive push notifications for a user. The push token is unique across
 * all users: registering it again from another account moves it to that account.
 */
export class Device {
  private props: DeviceProps;

  constructor(props: DeviceConstructorProps) {
    this.props = {
      id: props.id,
      userId: props.userId,
      platform: parsePlatform(props.platform),
      pushToken: PushToken.create(props.pushToken),
      updatedAt: props.updatedAt,
    };
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get platform() { return this.props.platform; }
  get pushToken() { return this.props.pushToken.value; }
  /** Last time the device was registered (the app registers on every login). */
  get updatedAt() { return this.props.updatedAt; }
}

export interface DeviceProps {
  id: string;
  userId: string;
  platform: Platform;
  pushToken: PushToken;
  updatedAt: Date;
}

export interface DeviceConstructorProps {
  id: string;
  userId: string;
  platform: Platform;
  pushToken: string;
  updatedAt: Date;
}
