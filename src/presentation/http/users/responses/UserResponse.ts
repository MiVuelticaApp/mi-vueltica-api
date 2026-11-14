import { AgeRange, UserProvince, UserRole } from "@/domain/users/entities/User";
import { ReputationLevel } from "@/domain/reputation/reputationRules";

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    surnames: string;
    ageRange: AgeRange | null;
    role: UserRole;
    province: UserProvince | null;
    /** ISO 8601 ("Miembro desde"). */
    createdAt: string;
    points: number;
    level: ReputationLevel;
    /** False until they accept the privacy notice: the app asks once (#7). */
    privacyAccepted: boolean;
    privacyVersion: string | null;
}
