import { SsoProvider, User } from "@/domain/users/entities/User";
import { IUserRepository, UserListFilters } from "@/domain/users/repositories/IUserRepository";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import { PrismaUserMapper } from "../mappers/PrismaUserMapper";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";

export default class PrismaUsersRepository implements IUserRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  /**
   * Fetch all users from the database.
   * @returns A promise that resolves to an array of User entities.
   */
  async all(): Promise<User[]> {
    try {
      const users = await this.client.user.findMany();
      return users.map((user) => PrismaUserMapper.toDomain(user));
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new DatabaseError("Could not fetch users", error);
    }
  }

  /**
   * Paginated list of active (not soft-deleted) users.
   * @param params Pagination and sort params.
   * @param filters Optional role filter and free-text search (email, name, surnames).
   */
  async list(params: PaginationParams, filters: UserListFilters): Promise<PaginatedResult<User>> {
    try {
      const where: Prisma.UserWhereInput = { deletedAt: null };
      if (filters.role) where.role = filters.role;
      if (filters.search) {
        where.OR = [
          { email: { contains: filters.search } },
          { name: { contains: filters.search } },
          { surnames: { contains: filters.search } },
        ];
      }

      return await paginate(
        this.client,
        params,
        {
          findMany: (tx, page) => tx.user.findMany({ where, ...page }),
          count: (tx) => tx.user.count({ where }),
        },
        (row) => PrismaUserMapper.toDomain(row),
      );
    } catch (error) {
      console.error("Error listing users:", error);
      throw new DatabaseError("Could not list users", error);
    }
  }

  /**
   * Find a user by a specific field.
   * @param value The value to search for.
   * @param field The field to search in (defaults to "id").
   * @returns A promise that resolves to a User entity or null if not found.
   */
  async find(value: string, field?: string): Promise<User | null> {
    try {
      const user = await this.client.user.findFirst({
        where: {
          [field || "id"]: value,
        },
      });
      return user ? PrismaUserMapper.toDomain(user) : null;
    } catch (error) {
      console.error("Error finding user:", error);
      throw new DatabaseError("Could not find user", error);
    }
  }

  /**
   * Find a user by their Google / Apple identity.
   * @param provider The SSO provider.
   * @param subject The stable user id returned by the provider (`sub`).
   * @returns A promise that resolves to a User entity or null if not found.
   */
  async findBySso(provider: SsoProvider, subject: string): Promise<User | null> {
    try {
      const user = await this.client.user.findUnique({
        where: {
          ssoProvider_ssoSubject: { ssoProvider: provider, ssoSubject: subject },
        },
      });
      return user ? PrismaUserMapper.toDomain(user) : null;
    } catch (error) {
      console.error("Error finding user by SSO identity:", error);
      throw new DatabaseError("Could not find user", error);
    }
  }

  /**
   * Create a new user in the database.
   * @param user The User entity to create.
   * @returns A promise that resolves when the user is created.
   */
  async create(user: User): Promise<void> {
    try {
      await this.client.user.create({ data: PrismaUserMapper.toCreateData(user) });
    } catch (error) {
      console.error("Error creating user:", error);
      throw new DatabaseInsertError("Could not create user", error);
    }
  }

  /**
   * Update an existing user in the database.
   * @param user The User entity to update.
   * @returns A promise that resolves when the user is updated.
   */
  async update(user: User): Promise<void> {
    try {
      await this.client.user.update({
        where: { id: user.id },
        data: PrismaUserMapper.toUpdateData(user),
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw new DatabaseInsertError("Could not update user", error);
    }
  }

  /**
   * Delete a user from the database.
   * @param id The ID of the user to delete.
   * @returns A promise that resolves when the user is deleted.
   */
  async delete(id: string): Promise<void> {
    try {
      await this.client.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new DatabaseInsertError("Could not delete user", error);
    }
  }
}
