export interface CreateUserRequest {
  name: string;
  surnames: string;
  email: string;
  password: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  identificationUrl?: string;
  imageUrl?: string;
}