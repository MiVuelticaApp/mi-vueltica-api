import IJwtService, { JwtPayload as DomainJwtPayload } from "@/domain/auth/services/IJwtService";
import jwt, { SignOptions, Secret } from "jsonwebtoken";

export default class JwtTokenService implements IJwtService {
  private readonly secret: Secret;
  private readonly expiresIn: string;

  constructor(secret?: Secret, expiresIn?: string) {
    this.secret = secret || (process.env.JWT_SECRET as Secret) || "your-super-secret-key";
    this.expiresIn = expiresIn || (process.env.JWT_EXPIRES_IN as string) || "7d";
  }

  generateToken(payload: Omit<DomainJwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload as string | object, this.secret, {
      expiresIn: this.expiresIn,
    } as SignOptions);
  }

  verifyToken(token: string): DomainJwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret);
      if (typeof decoded === "string") {
        // jwt.verify returned a string payload which cannot be typed as DomainJwtPayload
        return null;
      }
      return decoded as DomainJwtPayload;
    } catch (error) {
      console.error("JWT verification failed:", error);
      return null;
    }
  }
}
