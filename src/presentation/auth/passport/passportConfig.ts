import passport from "passport";
import { configureSerialization } from "./serialize";
import { configureLocalStrategy } from "./localStrategies";

export function passportConfig() {
  configureLocalStrategy();
  configureSerialization();
  return passport;
}
