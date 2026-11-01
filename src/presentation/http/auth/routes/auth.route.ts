import { Router } from "express";
import asyncHandler from "@/presentation/core/handlers/asyncHandler";
import validateSchema from "@/presentation/core/middlewares/validateSchema";
import { GoogleLoginSchema } from "../validators/googleLogin";
import { AppleLoginSchema } from "../validators/appleLogin";
import { TestLoginSchema } from "../validators/testLogin";
import { authController } from "@/dependencyInjection/container";
import jwtAuth from "../middlewares/jwtAuth";
import rateLimit from "@/presentation/core/middlewares/rateLimit";
import ENV from "@/presentation/core/config/env";

const authRouter = Router();

// Google OAuth login - returns JWT token
authRouter.post("/google",
  validateSchema(GoogleLoginSchema),
  asyncHandler(authController.googleLogin.bind(authController))
);

// Apple Sign In - returns JWT token
authRouter.post("/apple",
  validateSchema(AppleLoginSchema),
  asyncHandler(authController.appleLogin.bind(authController))
);

// Fixed-credential login for App Store / Google Play review. Only mounted when
// TEST_LOGIN_ENABLED === "true": with the flag off (the default) this route does not exist,
// so it 404s instead of being reachable-but-rejecting.
if (ENV.TEST_LOGIN_ENABLED) {
  authRouter.post("/qa",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 attempts / 15 min per IP
    validateSchema(TestLoginSchema),
    asyncHandler(authController.testLogin.bind(authController))
  );
}

// Refresh JWT token
authRouter.post("/refresh",
  asyncHandler(authController.refreshToken.bind(authController))
);

// Logout (client-side token removal)
authRouter.post("/logout",
  jwtAuth, // Require valid token to logout
  asyncHandler(authController.logout.bind(authController))
);

authRouter.get("/me",
  jwtAuth, // Require valid token to access user info
  asyncHandler(authController.me.bind(authController))
);

export default authRouter;
