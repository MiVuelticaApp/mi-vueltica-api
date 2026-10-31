import ApplicationError from "@/application/core/errors/ApplicationError";

export class UserCreationError extends ApplicationError {
    constructor(message?: string) {
        super(message || "Failed to create user");
        this.name = "UserCreationError";
     }
}