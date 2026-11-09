import ENV from "@/presentation/http/core/config/env";
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
import PrismaUserInterestRepository from "@/infrastructure/users/repositories/PrismaUserInterestRepository";
import { UserInterestService } from "@/application/users/services/implementations/UserInterestService";
import MyInterestsController from "@/presentation/http/users/controllers/MyInterests.controller";
import PrismaCategoryRepository from "@/infrastructure/categories/repositories/PrismaCategoryRepository";
import { CategoryService } from "@/application/categories/services/implementations/CategoryService";
import CategoryController from "@/presentation/http/categories/controllers/Category.controller";
import PrismaProvinceRepository from "@/infrastructure/geography/repositories/PrismaProvinceRepository";
import { ProvinceService } from "@/application/geography/services/implementations/ProvinceService";
import ProvinceController from "@/presentation/http/geography/controllers/Province.controller";
import PrismaCantonRepository from "@/infrastructure/geography/repositories/PrismaCantonRepository";
import { CantonService } from "@/application/geography/services/implementations/CantonService";
import CantonController from "@/presentation/http/geography/controllers/Canton.controller";
import PrismaSourceRepository from "@/infrastructure/sources/repositories/PrismaSourceRepository";
import { SourceService } from "@/application/sources/services/implementations/SourceService";
import SourceController from "@/presentation/http/sources/controllers/Source.controller";
import PrismaPlaceRepository from "@/infrastructure/places/repositories/PrismaPlaceRepository";
import { PlaceService } from "@/application/places/services/implementations/PlaceService";
import PlaceController from "@/presentation/http/places/controllers/Place.controller";
import PrismaEventRepository from "@/infrastructure/events/repositories/PrismaEventRepository";
import { EventService } from "@/application/events/services/implementations/EventService";
import EventController from "@/presentation/http/events/controllers/Event.controller";
import PrismaFavoriteRepository from "@/infrastructure/favorites/repositories/PrismaFavoriteRepository";
import PrismaDeviceRepository from "@/infrastructure/devices/repositories/PrismaDeviceRepository";
import { DeviceService } from "@/application/devices/services/implementations/DeviceService";
import PrismaNotificationRepository from "@/infrastructure/notifications/repositories/PrismaNotificationRepository";
import { NotificationService } from "@/application/notifications/services/implementations/NotificationService";
import { FavoriteService } from "@/application/favorites/services/implementations/FavoriteService";
import FavoriteController from "@/presentation/http/favorites/controllers/Favorite.controller";
import PrismaReviewRepository from "@/infrastructure/reviews/repositories/PrismaReviewRepository";
import { ReviewService } from "@/application/reviews/services/implementations/ReviewService";
import { IReviewService } from "@/application/reviews/services/interfaces/IReviewService";
import ReviewController from "@/presentation/http/reviews/controllers/Review.controller";
import PrismaSubmissionRepository from "@/infrastructure/submissions/repositories/PrismaSubmissionRepository";
import { PrismaSubmissionApprovalUnitOfWork } from "@/infrastructure/submissions/unitsOfWork/PrismaSubmissionApprovalUnitOfWork";
import { SubmissionService } from "@/application/submissions/services/implementations/SubmissionService";
import MySubmissionsController from "@/presentation/http/submissions/controllers/MySubmissions.controller";
import MyDevicesController from "@/presentation/http/devices/controllers/MyDevices.controller";
import MyNotificationsController from "@/presentation/http/notifications/controllers/MyNotifications.controller";
import SubmissionsController from "@/presentation/http/submissions/controllers/Submissions.controller";
import ResendEmailProvider from "@/infrastructure/email/providers/ResendEmailProvider";
import MyProfileController from "@/presentation/http/users/controllers/MyProfile.controller";
import { IEmailService } from "@/domain/core/services/IEmailService";
import AdminUsersController from "@/presentation/http/users/controllers/AdminUsers.controller";
import SystemController from "@/presentation/http/system/controllers/SystemController";
import AuthController from "@/presentation/http/auth/controllers/Auth.controller";
import McpController from "@/presentation/mcp/controllers/Mcp.controller";
import RandomUuidIDGenerator from "@/infrastructure/core/services/RandomUuidIDGenerator";
import PrismaUploadRepository from "@/infrastructure/uploads/repositories/PrismaUploadRepository";
import S3FileStorage from "@/infrastructure/uploads/storage/S3FileStorage";
import SharpImageProcessor from "@/infrastructure/uploads/images/SharpImageProcessor";
import { IFileStorage } from "@/domain/uploads/services/IFileStorage";
import { UploadService } from "@/application/uploads/services/implementations/UploadService";
import { IUploadService } from "@/application/uploads/services/interfaces/IUploadService";
import UploadController from "@/presentation/http/uploads/controllers/Upload.controller";
import FileController from "@/presentation/http/uploads/controllers/File.controller";
import PrismaPhotoRepository from "@/infrastructure/photos/repositories/PrismaPhotoRepository";
import { PrismaPhotoGalleryUnitOfWork } from "@/infrastructure/photos/unitsOfWork/PrismaPhotoGalleryUnitOfWork";
import { PhotoService } from "@/application/photos/services/implementations/PhotoService";
import { IPhotoService } from "@/application/photos/services/interfaces/IPhotoService";
import PhotoController from "@/presentation/http/photos/controllers/Photo.controller";
import { PrismaCommunityUnitOfWork } from "@/infrastructure/community/unitsOfWork/PrismaCommunityUnitOfWork";
import PrismaVerificationRepository from "@/infrastructure/community/repositories/PrismaVerificationRepository";
import PrismaReportRepository from "@/infrastructure/community/repositories/PrismaReportRepository";
import { CommunityService } from "@/application/community/services/implementations/CommunityService";
import { ICommunityService } from "@/application/community/services/interfaces/ICommunityService";
import CommunityController from "@/presentation/http/community/controllers/Community.controller";
import { createMcpServerFactory } from "@/presentation/mcp/server/createMcpServer";

// ==================== INFRASTRUCTURE ====================

// repositories
export const userRepository = new PrismaUsersRepository();
export const categoryRepository = new PrismaCategoryRepository();
export const provinceRepository = new PrismaProvinceRepository();
export const cantonRepository = new PrismaCantonRepository();
export const userInterestRepository = new PrismaUserInterestRepository();
export const sourceRepository = new PrismaSourceRepository();
export const placeRepository = new PrismaPlaceRepository();
export const eventRepository = new PrismaEventRepository();
export const favoriteRepository = new PrismaFavoriteRepository();
export const reviewRepository = new PrismaReviewRepository();
export const submissionRepository = new PrismaSubmissionRepository();
export const deviceRepository = new PrismaDeviceRepository();
export const notificationRepository = new PrismaNotificationRepository();
export const uploadRepository = new PrismaUploadRepository();
export const photoRepository = new PrismaPhotoRepository();

// unit of work
export const userDeletionUOW = new PrismaUserDeletionUnitOfWork();
export const submissionApprovalUOW = new PrismaSubmissionApprovalUnitOfWork();
export const photoGalleryUOW = new PrismaPhotoGalleryUnitOfWork();

// providers
export const idGenerator = new UuidIDGenerator();
export const googleOAuthProvider = new GoogleOAuthProvider([
  ENV.GOOGLE_IOS_CLIENT_ID,
  ENV.GOOGLE_ANDROID_CLIENT_ID,
  ENV.GOOGLE_WEB_CLIENT_ID,
]);
export const appleOAuthProvider = new AppleOAuthProvider(
  ENV.APPLE_TEAM_ID,
  ENV.APPLE_KEY_ID,
  ENV.APPLE_PRIVATE_KEY,
  ENV.APPLE_CLIENT_ID,
);
export const emailService: IEmailService = new ResendEmailProvider(ENV.RESEND_API_KEY, ENV.MAIL_FROM);
export const fileStorage: IFileStorage = new S3FileStorage({
  endpoint: ENV.S3_ENDPOINT,
  region: ENV.S3_REGION,
  accessKeyId: ENV.S3_ACCESS_KEY,
  secretAccessKey: ENV.S3_SECRET_KEY,
  bucket: ENV.S3_BUCKET,
  forcePathStyle: ENV.S3_FORCE_PATH_STYLE,
});
export const imageProcessor = new SharpImageProcessor();


// services
export const jwtService = new JwtTokenService();


// ==================== APPLICATION ====================

// services
export const userService = new UserService(userRepository);
export const categoryService = new CategoryService(categoryRepository);
export const provinceService = new ProvinceService(provinceRepository);
export const cantonService = new CantonService(cantonRepository, provinceRepository);
export const sourceService = new SourceService(sourceRepository);
export const placeService = new PlaceService(placeRepository, cantonRepository, categoryRepository, sourceRepository);
export const eventService = new EventService(eventRepository, placeRepository, categoryRepository, sourceRepository);
export const favoriteService = new FavoriteService(favoriteRepository, placeRepository, eventRepository);
export const deviceService = new DeviceService(deviceRepository);
export const notificationService = new NotificationService(notificationRepository);
export const uploadService: IUploadService = new UploadService(
  uploadRepository,
  fileStorage,
  imageProcessor,
  // Upload ids are capabilities (public file URLs): random v4, not time-ordered v7.
  new RandomUuidIDGenerator(),
  {
    fileUrlPrefix: `${ENV.PUBLIC_API_URL}/api/v1/files`,
    orphanGraceMs: ENV.UPLOAD_ORPHAN_GRACE_HOURS * 60 * 60 * 1000,
  },
);
export const reviewService: IReviewService = new ReviewService(reviewRepository, placeRepository, eventRepository, uploadService);
export const communityService: ICommunityService = new CommunityService(
  new PrismaCommunityUnitOfWork(),
  new PrismaVerificationRepository(),
  new PrismaReportRepository(),
  uploadService,
);
export const photoService: IPhotoService = new PhotoService(photoRepository, photoGalleryUOW, placeRepository, eventRepository, uploadService);
export const submissionService = new SubmissionService(submissionRepository, placeRepository, cantonRepository, categoryRepository, submissionApprovalUOW, uploadService);
export const userInterestService = new UserInterestService(userRepository, userInterestRepository, categoryRepository);
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
  userInterestService,
);

export const myInterestsController = new MyInterestsController(userInterestService);

export const categoryController = new CategoryController(categoryService);
export const provinceController = new ProvinceController(provinceService);
export const cantonController = new CantonController(cantonService);
export const sourceController = new SourceController(sourceService);
export const placeController = new PlaceController(placeService, favoriteService, communityService);
export const eventController = new EventController(eventService, favoriteService, communityService);
export const favoriteController = new FavoriteController(favoriteService);
export const reviewController = new ReviewController(reviewService);
export const communityController = new CommunityController(communityService);
export const mySubmissionsController = new MySubmissionsController(submissionService);
export const myDevicesController = new MyDevicesController(deviceService);
export const myNotificationsController = new MyNotificationsController(notificationService);
export const submissionsController = new SubmissionsController(submissionService);
export const uploadController = new UploadController(uploadService);
export const fileController = new FileController(uploadService);
export const photoController = new PhotoController(photoService);
export const adminUsersController = new AdminUsersController(
  adminUserService,
  accountDeletionExternalCleanup,
);

export const authController = new AuthController(
  oAuthService,
  jwtService,
  userService,
  testLoginService,
  deviceService,
)

export const systemController = new SystemController(ENV.MIN_FRONTEND_VERSION);

// ==================== MCP ====================

export const mcpController = new McpController(createMcpServerFactory({ categoryService, placeService, eventService }));
