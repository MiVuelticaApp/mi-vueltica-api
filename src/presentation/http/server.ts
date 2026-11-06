import app from "./app";
import ENV from "./core/config/env";
import { fileStorage, uploadService } from "@/dependencyInjection/container";
import { startUploadCleanupJob } from "@/presentation/jobs/uploadCleanup.job";

// Creates the MinIO bucket on first boot. A storage outage must not keep the API down: uploads
// and file reads answer 503 until MinIO is reachable again.
fileStorage.ensureReady().catch((error) => console.error("[storage] MinIO is not ready:", error));
startUploadCleanupJob(uploadService);

app.listen(ENV.PORT, () => {
  console.log(`Server is running on port ${ENV.PORT}`);
});
