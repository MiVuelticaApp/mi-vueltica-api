import { oAuthService } from "@/dependencyInjection/container";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export function configureLocalStrategy() {
  
    passport.use(
    "local-google",
    new LocalStrategy(
      {
        usernameField: "token",
        passwordField: "token",
        
      },
      async (token: string, _: string, done) => {
        try {
          if (!token) {
            return done(null, false, { message: "No token provided" });
          }
          const user = await oAuthService.google(token);
          return done(null, user);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          return done(null, false, { message: err.message });
        }
      }
    )
  );
      

}
