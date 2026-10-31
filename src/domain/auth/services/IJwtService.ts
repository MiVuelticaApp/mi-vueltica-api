export interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

export default interface IJwtService {
  generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
  verifyToken(token: string): JwtPayload | null;
}
