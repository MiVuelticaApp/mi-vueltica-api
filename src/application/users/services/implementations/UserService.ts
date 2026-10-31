/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "@/domain/users/entities/User";
import { IUserRepository } from "@/domain/users/repositories/IUserRepository";
import { IUserService } from "../interfaces/IUserService";
import { UserCreationError } from "../../errors/UserCreationError";

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

    async update(user: User): Promise<User> {
        // verify user exist
        await this.userRepository.update(user);
        const updatedUser = await this.userRepository.find(user.id, "id");
        if (!updatedUser) throw new UserCreationError();
        return updatedUser;
    }
}