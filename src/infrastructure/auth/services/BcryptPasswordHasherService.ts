import { IPasswordHasher } from "@/domain/auth/services/IPasswordHasherService";
import bcrypt from "bcryptjs";


export default class BcryptPasswordHasherService implements IPasswordHasher {
  /** Hash a plain text password.
   * @param password The plain text password to hash.
   * @returns The hashed password.
   */
  async hash(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /** Compare a plain text password with a hashed password.
   * @param password The plain text password.
   * @param hashedPassword The hashed password.
   * @returns True if the passwords match, false otherwise.
   */
  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}