import { User } from "@/domain/users/entities/User";
import { IOAuthService } from "../interfaces/IOAuthService";
import { IOAuthProvider } from "@/domain/auth/providers/IOAuthProvider";
import { IIDGenerator } from "@/domain/core/services/IIDGenerator";
import { IUserService } from "@/application/users/services/interfaces/IUserService";
import { InvalidCredentialsError } from "../../errors/InvalidCredentialsError";

export default class OAuthService implements IOAuthService {
  constructor(
    private readonly usersService: IUserService,
    private readonly googleOAuthProvider: IOAuthProvider,
    private readonly appleOAuthProvider: IOAuthProvider,
    private readonly idGenerator: IIDGenerator
  ) {}

  async google(accessToken: string): Promise<User> {
    try {
      const userInfo = await this.googleOAuthProvider.getUserInfo(accessToken);
      let user = await this.usersService.find(userInfo.email, "email");
      if (!user) {
        const id = this.idGenerator.generate()
        const newUser = new User({
          email: userInfo.email,
          id,
          name: userInfo.name!,
          surnames: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        user = await this.usersService.create(newUser);
      }

      return user;
    } catch (error) {
      console.error(error);
      throw new InvalidCredentialsError();
    }
  }

  async apple(identityToken: string, firstName?: string, lastName?: string): Promise<User> {
    try {
      const userInfo = await this.appleOAuthProvider.getUserInfo(identityToken);
      let user = await this.usersService.find(userInfo.email, "email");
      if (!user) {
        const id = this.idGenerator.generate();
        const newUser = new User({
          email: userInfo.email,
          id,
          name: firstName ?? "",
          surnames: lastName ?? "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        user = await this.usersService.create(newUser);
      }

      return user;
    } catch (error) {
      console.error(error);
      throw new InvalidCredentialsError();
    }
  }
}