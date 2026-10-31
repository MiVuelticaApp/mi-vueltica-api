export interface UpdateUserRequest {
  id: string; // Coming from URL or body
  name?: string;
  birthdate?: string;
  surnames?: string;
  imageUrl?: string;
  gender?: "male" | "female" | "other";
}
