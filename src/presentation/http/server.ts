import app from "./app";
import ENV from "./core/config/env";
import { fileStorage, pushNotifier, uploadService } from "@/dependencyInjection/container";
import { startUploadCleanupJob } from "@/presentation/jobs/uploadCleanup.job";
import { startNearbyPlansJob } from "@/presentation/jobs/nearbyPlans.job";

// Creates the bucket on first boot. A storage outage must not keep the API down: uploads and
// file reads answer 503 until the object storage (SeaweedFS) is reachable again.
fileStorage.ensureReady().catch((error: Error) => console.error(`[storage] object storage is not ready: ${error.message}`));
startUploadCleanupJob(uploadService);
if (ENV.NEARBY_PUSH_ENABLED) startNearbyPlansJob(pushNotifier);

app.listen(ENV.PORT, () => {
  console.log(`Server is running on port ${ENV.PORT}`);
});
