import { AgeRange, UserRole } from "@/domain/users/entities/User";

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    surnames: string;
    ageRange: AgeRange | null;
    role: UserRole;
}
