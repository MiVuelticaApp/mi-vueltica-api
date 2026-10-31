import { Request, Response } from "express";
import { IOAuthService } from "@/application/auth/services/interfaces/IOAuthService";
import { AuthResponse } from "../responses/AuthResponse";
import IJwtService from "@/domain/auth/services/IJwtService";
import { IUserService } from "@/application/users/services/interfaces/IUserService";
import { ITestLoginService } from "@/application/auth/services/interfaces/ITestLoginService";
import UserDtoMapper from "@/presentation/users/mappers/User.mapper";
import { TestLoginRequest } from "../requests/TestLoginRequest";

export default class AuthController {
  constructor(
    private readonly oAuthService: IOAuthService,
    private readonly jwtService: IJwtService,
    private readonly usersService: IUserService,
    private readonly testLoginService: ITestLoginService
  ) {}

  async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      console.log(req.body);
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ message: "Token de Google es requerido" });
        return;
      }
      
      // Authenticate with Google and get/create user
      const user = await this.oAuthService.google(token);
      
      // Generate JWT token
      const jwtToken = this.jwtService.generateToken({
        id: user.id,
        email: user.email.value,
      });

      const userResponse = UserDtoMapper.toResponse(user);

      const response: AuthResponse = {
        user: userResponse,
        token: jwtToken,
        expiresIn: "7d", // Should match JWT_EXPIRES_IN
      };

      res.json(response);
    } catch (error) {
      console.error("Google login error:", error);
      res.status(401).json({ message: "Autenticación fallida" });
    }
  }

  async appleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { identityToken, firstName, lastName } = req.body;

      const user = await this.oAuthService.apple(identityToken, firstName, lastName);

      const jwtToken = this.jwtService.generateToken({
        id: user.id,
        email: user.email.value,
      });

      const userResponse = UserDtoMapper.toResponse(user);

      const response: AuthResponse = {
        user: userResponse,
        token: jwtToken,
        expiresIn: "7d",
      };

      res.json(response);
    } catch (error) {
      console.error("Apple login error:", error);
      res.status(401).json({ message: "Autenticación fallida" });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: "Token no proporcionado" });
      return;
    }

    const token = authHeader.substring(7);
    const payload = this.jwtService.verifyToken(token);

    if (!payload) {
      res.status(401).json({ message: "Token inválido" });
      return;
    }

    // Fetch user information
    const user = await this.usersService.find(payload.id);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    res.json(UserDtoMapper.toResponse(user));
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: "Token no proporcionado" });
        return;
      }

      const token = authHeader.substring(7);
      const payload = this.jwtService.verifyToken(token);
      
      if (!payload) {
        res.status(401).json({ message: "Token inválido" });
        return;
      }

      // Generate new token
      const newToken = this.jwtService.generateToken({
        id: payload.id,
        email: payload.email,
      });

      res.json({
        token: newToken,
        expiresIn: "7d",
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(401).json({ message: "Error renovando token" });
    }
  }

  // Fixed-credential login for App Store / Google Play reviewers. The route is only mounted
  // when TEST_LOGIN_ENABLED is true, so this handler is unreachable in normal deployments.
  // No try/catch here: asyncHandler forwards any rejection (InvalidCredentialsError included)
  // to the central errorHandler.
  async testLogin(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as TestLoginRequest;
    const user = await this.testLoginService.authenticate(email, password);

    // Audit trail for a temporary, high-privilege-adjacent bypass of normal OAuth login.
    // Never log the password or anything beyond the requesting IP.
    console.warn(`[test-login] successful review login from ip=${req.ip}`);

    const jwtToken = this.jwtService.generateToken({
      id: user.id,
      email: user.email.value,
    });

    const response: AuthResponse = {
      user: UserDtoMapper.toResponse(user),
      token: jwtToken,
      expiresIn: "7d",
    };

    res.json(response);
  }

  async logout(req: Request, res: Response): Promise<void> {
    // With JWT, logout is handled client-side by removing the token
    // Optionally, you could implement a token blacklist here
    res.json({ message: "Sesión cerrada exitosamente" });
  }
}
