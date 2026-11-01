/* eslint-disable @typescript-eslint/no-explicit-any */
import { SsoProvider, User, UserProfileChanges } from "@/domain/users/entities/User";
import { IUserRepository } from "@/domain/users/repositories/IUserRepository";
import { IUserService } from "../interfaces/IUserService";
import { UserCreationError } from "../../errors/UserCreationError";
import { UserNotFoundError } from "../../errors/UserNotFoundError";

export class UserService implements IUserService {
    constructor(
        private readonly userRepository: IUserRepository,
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

    async updateProfile(id: string, changes: UserProfileChanges): Promise<User> {
        const user = await this.userRepository.find(id, "id");
        if (!user) throw new UserNotFoundError();

        user.updateProfile(changes);
        await this.userRepository.update(user);

        const updatedUser = await this.userRepository.find(id, "id");
        if (!updatedUser) throw new UserNotFoundError();
        return updatedUser;
    }
}
