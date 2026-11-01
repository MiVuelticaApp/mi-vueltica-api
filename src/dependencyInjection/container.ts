import ENV from "@/presentation/core/config/env";
import OAuthService from "@/application/auth/services/implementations/IOAuthService";
import TestLoginService from "@/application/auth/services/implementations/TestLoginService";
import { ITestLoginService } from "@/application/auth/services/interfaces/ITestLoginService";
import { TestAccountSeeder } from "@/application/auth/services/implementations/TestAccountSeeder";
import { ITestAccountSeeder } from "@/application/auth/services/interfaces/ITestAccountSeeder";
import { UserService } from "@/application/users/services/implementations/UserService";
import { AdminUserService } from "@/application/users/services/implementations/AdminUserService";
import { IAdminUserService } from "@/application/users/services/interfaces/IAdminUserService";
import { AccountDeletionService } from "@/application/users/services/implementations/AccountDeletionService";
import { IAccountDeletionService } from "@/application/users/services/interfaces/IAccountDeletionService";
import AccountDeletionEmailSender from "@/application/users/services/AccountDeletionEmailSender";
import { AccountDeletionExternalCleanup } from "@/application/users/services/AccountDeletionExternalCleanup";
import { IAccountDeletionExternalCleanup } from "@/application/users/services/interfaces/IAccountDeletionExternalCleanup";
import GoogleOAuthProvider from "@/infrastructure/auth/providers/GoogleOAuthProvider";
import AppleOAuthProvider from "@/infrastructure/auth/providers/AppleOAuthProvider";
import JwtTokenService from "@/infrastructure/auth/services/JwtTokenService";
import UuidIDGenerator from "@/infrastructure/core/services/UuidIDGenerator";
import { PrismaUserDeletionUnitOfWork } from "@/infrastructure/users/unitsOfWork/PrismaUserDeletionUnitOfWork";
import PrismaUsersRepository from "@/infrastructure/users/repositories/PrismaUsersRepository";
import ResendEmailProvider from "@/infrastructure/email/providers/ResendEmailProvider";
import MyProfileController from "@/presentation/users/controllers/MyProfile.controller";
import { IEmailService } from "@/domain/core/services/IEmailService";
import AdminUsersController from "@/presentation/users/controllers/AdminUsers.controller";
import SystemController from "@/presentation/system/controllers/SystemController";
import AuthController from "@/presentation/auth/controllers/Auth.controller";

// ==================== INFRASTRUCTURE ====================

// repositories
export const userRepository = new PrismaUsersRepository();

// unit of work
export const userDeletionUOW = new PrismaUserDeletionUnitOfWork();

// providers
export const idGenerator = new UuidIDGenerator();
export const googleOAuthProvider = new GoogleOAuthProvider();
export const appleOAuthProvider = new AppleOAuthProvider(
  ENV.APPLE_TEAM_ID,
  ENV.APPLE_KEY_ID,
  ENV.APPLE_PRIVATE_KEY,
  ENV.APPLE_CLIENT_ID,
);
export const emailService: IEmailService = new ResendEmailProvider(ENV.RESEND_API_KEY, ENV.MAIL_FROM);


// services
export const jwtService = new JwtTokenService();


// ==================== APPLICATION ====================

// services
export const userService = new UserService(userRepository);
export const oAuthService = new OAuthService(userService, googleOAuthProvider, appleOAuthProvider, idGenerator);


export const testAccountSeeder: ITestAccountSeeder = new TestAccountSeeder(
  userService,
);
export const testLoginService: ITestLoginService = new TestLoginService(userService, idGenerator, {
  enabled: ENV.TEST_LOGIN_ENABLED,
  email: ENV.TEST_LOGIN_EMAIL,
  password: ENV.TEST_LOGIN_PASSWORD,
}, testAccountSeeder);

export const accountDeletionService: IAccountDeletionService = new AccountDeletionService(userDeletionUOW);
export const adminUserService: IAdminUserService = new AdminUserService(userRepository, accountDeletionService);
export const accountDeletionEmailSender = new AccountDeletionEmailSender(emailService);
export const accountDeletionExternalCleanup: IAccountDeletionExternalCleanup = new AccountDeletionExternalCleanup(
  appleOAuthProvider,
  accountDeletionEmailSender,
);


//  ==================== PRESENTATION ====================

// controllers
export const myProfileController = new MyProfileController(
  userService,
  accountDeletionService,
  accountDeletionExternalCleanup,
);

export const adminUsersController = new AdminUsersController(
  adminUserService,
  accountDeletionExternalCleanup,
);

export const authController = new AuthController(
  oAuthService,
  jwtService,
  userService,
  testLoginService
)

export const systemController = new SystemController(ENV.MIN_FRONTEND_VERSION);

