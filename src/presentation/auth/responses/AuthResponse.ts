export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    surnames: string;
  };
  token: string;
  expiresIn: string;
}
