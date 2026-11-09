import DomainError from "@/domain/core/errors/DomainError";

/** The app only lists plans that are free or cost up to ₡5.000 per person. */
export class PriceAboveLimitError extends DomainError {
  constructor(message?: string) {
    super(message || "El precio por persona no puede superar ₡5.000");
    this.name = "PriceAboveLimitError";
    this.statusCode = 422;
    this.status = "fail";
  }
}
