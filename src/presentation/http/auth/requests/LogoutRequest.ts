export interface LogoutRequest {
  /** Push token of the current device, to stop sending it notifications for this account. */
  pushToken?: string;
}
