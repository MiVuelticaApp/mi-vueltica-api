import { Request, Response, NextFunction } from "express";
import { jwtService } from "@/dependencyInjection/container";

// Export the middleware directly
export default function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: "Token no proporcionado" });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  const payload = jwtService.verifyToken(token);
  
  if (!payload) {
    res.status(401).json({ message: "Token inválido o expirado" });
    return;
  }

  req.user = {
    id: payload.id,
    email: payload.email,
  };

  next();
}
