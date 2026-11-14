import ApplicationError from "@/application/core/errors/ApplicationError";

/** The plan or review has no person behind it (curated content, or an author who deleted their account). */
export class BlockTargetWithoutAuthorError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Esta publicación no tiene una persona autora");
    this.name = "BlockTargetWithoutAuthorError";
    this.statusCode = 404;
    this.status = "fail";
    this.isOperational = true;
    this.layer = "application";
  }
}
