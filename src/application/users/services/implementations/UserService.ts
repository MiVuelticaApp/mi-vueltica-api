/* eslint-disable @typescript-eslint/no-explicit-any */
import { SsoProvider, User, UserProvince } from "@/domain/users/entities/User";
import { IUserRepository, UserActivityCounts } from "@/domain/users/repositories/IUserRepository";
import { IProvinceRepository } from "@/domain/geography/repositories/IProvinceRepository";
import { InvalidProvinceError } from "@/application/geography/errors/InvalidProvinceError";
import { IUserService, UpdateProfileInput } from "../interfaces/IUserService";
import { UserCreationError } from "../../errors/UserCreationError";
import { UserNotFoundError } from "../../errors/UserNotFoundError";

export class UserService implements IUserService {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly provinceRepository: IProvinceRepository,
    ) {
    }

    /**
     * Create user service
     * @param userData
     * @returns {Promise<User>}
     */
    async create(user: User): Promise<User> {
        await this.userRepository.create(user);
        const createdUser = await this.userRepository.find(user.id, "id");
        if (!createdUser) throw new UserCreationError();

        return createdUser;
    }
    async find(value: any, field: string = "id"): Promise<User | null> {
        return this.userRepository.find(value, field);
    }

    async findBySso(provider: SsoProvider, subject: string): Promise<User | null> {
        return this.userRepository.findBySso(provider, subject);
    }

    async updateProfile(id: string, { provinceId, ...changes }: UpdateProfileInput): Promise<User> {
        const user = await this.userRepository.find(id, "id");
        if (!user) throw new UserNotFoundError();

        const province = provinceId === undefined ? undefined : await this.resolveProvince(provinceId);
        user.updateProfile({ ...changes, province });
        await this.userRepository.update(user);

        const updatedUser = await this.userRepository.find(id, "id");
        if (!updatedUser) throw new UserNotFoundError();
        return updatedUser;
    }

    async activityCounts(userId: string): Promise<UserActivityCounts> {
        return this.userRepository.activityCounts(userId);
    }

    private async resolveProvince(provinceId: number | null): Promise<UserProvince | null> {
        if (provinceId === null) return null;
        const province = await this.provinceRepository.find(provinceId);
        if (!province) throw new InvalidProvinceError();
        return { id: province.id, name: province.name };
    }
}
