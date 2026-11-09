import DomainError from "@/domain/core/errors/DomainError";

export class UnsupportedImageError extends DomainError {
  constructor(message?: string) {
    super(message || "El archivo debe ser una imagen JPEG, PNG o WebP");
    this.name = "UnsupportedImageError";
    this.statusCode = 415;
    this.status = "fail";
  }
}
