import InfrastructureError from "./InfrastructureError";

/** Object storage (SeaweedFS / S3) is unreachable or failed: answered as 503 so clients can retry. */
export default class FileStorageError extends InfrastructureError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "FileStorageError";
    this.statusCode = 503;
    this.status = "error";
  }
}
