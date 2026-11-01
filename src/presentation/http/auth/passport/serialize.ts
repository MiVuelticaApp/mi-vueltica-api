import { userService } from "../../../dependencyInjection/container";
import passport from "passport";

export function configureSerialization() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await userService.find(id);
      done(null, user);
    } catch {
      done(null, false);
    }
  });
}
