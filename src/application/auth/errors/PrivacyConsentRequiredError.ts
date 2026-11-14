import ApplicationError from "@/application/core/errors/ApplicationError";

/** A new account needs the person to accept the privacy notice first (Ley 8968 art. 5). */
export class PrivacyConsentRequiredError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Debes aceptar el aviso de privacidad para crear tu cuenta");
    this.name = "PrivacyConsentRequiredError";
    this.statusCode = 400;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}
