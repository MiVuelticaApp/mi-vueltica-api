---
name: Infrastructure Layer Generator
description: Rules and templates for the infrastructure layer (Prisma repositories, mappers, units of work, external providers).
---

# Infrastructure Layer

The infrastructure layer implements the domain interfaces with Prisma (MariaDB) and external
services. Nothing outside this layer imports Prisma types, except `prismaErrorMapper.ts` in the
HTTP error handler.

Reference implementation: the `categories` module (`src/infrastructure/categories/`). For other
cases, see "Variants" at the end.

---

## Folder structure

```
src/infrastructure/{module}/
  repositories/Prisma{Model}Repository.ts
  mappers/Prisma{Model}Mapper.ts
  unitsOfWork/Prisma{UseCase}UnitOfWork.ts     # only when a use case needs a transaction
```

The schema lives in `src/infrastructure/prisma/schema.prisma`; after changing it, run
`npx prisma migrate dev --name <change>` and `npx prisma generate`.

---

## Mapper

```ts
// src/infrastructure/categories/mappers/PrismaCategoryMapper.ts
import { Category } from "@/domain/categories/entities/Category";
import { Category as PrismaCategory } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaCategoryMapper {
  static toDomain(row: PrismaCategory): Category {
    return new Category({ id: row.id, name: row.name });
  }
}
```

Rules:
- Import Prisma types from `@/infrastructure/prisma/generated/prisma/client` (the client is generated
  there, **not** in `@prisma/client`).
- Static `toDomain(row)` only. Writes pass the fields to Prisma directly in the repository; there is
  no `toPersistence`.
- Convert Prisma-specific types here: `Decimal` → `number` with `.toNumber()` (see
  `PrismaPlaceMapper`), `Json` → typed object.

---

## Repository

```ts
// src/infrastructure/categories/repositories/PrismaCategoryRepository.ts
import { Category } from "@/domain/categories/entities/Category";
import {
  CategoryListFilters,
  CategoryUsage,
  ICategoryRepository,
} from "@/domain/categories/repositories/ICategoryRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaCategoryMapper } from "../mappers/PrismaCategoryMapper";

export default class PrismaCategoryRepository implements ICategoryRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async list(params: PaginationParams, filters: CategoryListFilters = {}): Promise<PaginatedResult<Category>> {
    try {
      const where: Prisma.CategoryWhereInput = filters.search
        ? { name: { contains: filters.search } }
        : {};
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.category.findMany({ where, ...page, orderBy: page.orderBy ?? { name: "asc" } }),
          count: (tx) => tx.category.count({ where }),
        },
        PrismaCategoryMapper.toDomain,
      );
    } catch (error) {
      console.error("Error listing categories:", error);
      throw new DatabaseError("Could not list categories", error);
    }
  }

  async find(id: number): Promise<Category | null> {
    try {
      const row = await this.client.category.findUnique({ where: { id } });
      return row ? PrismaCategoryMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding category:", error);
      throw new DatabaseError("Could not find category", error);
    }
  }

  async create(name: string): Promise<Category> {
    try {
      const row = await this.client.category.create({ data: { name } });
      return PrismaCategoryMapper.toDomain(row);
    } catch (error) {
      console.error("Error creating category:", error);
      throw new DatabaseInsertError("Could not create category", error);
    }
  }

  async update(category: Category): Promise<void> {
    try {
      await this.client.category.update({ where: { id: category.id }, data: { name: category.name } });
    } catch (error) {
      console.error("Error updating category:", error);
      throw new DatabaseInsertError("Could not update category", error);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.client.category.delete({ where: { id } });
    } catch (error) {
      console.error("Error deleting category:", error);
      throw new DatabaseInsertError("Could not delete category", error);
    }
  }

  async countUsages(id: number): Promise<CategoryUsage> {
    try {
      const [places, events] = await Promise.all([
        this.client.place.count({ where: { categoryId: id } }),
        this.client.event.count({ where: { categoryId: id } }),
      ]);
      return { places, events };
    } catch (error) {
      console.error("Error counting category usages:", error);
      throw new DatabaseError("Could not check category usage", error);
    }
  }
}
```

Rules:
- Implement the domain interface; return domain entities (through the mapper), never Prisma rows.
- **Constructor takes an optional `Prisma.TransactionClient`** and falls back to the global `prisma`.
  Use `this.client`, never `prisma` directly, so the repository also works inside a unit of work.
- Paginate with `paginate(...)` (it runs `findMany` + `count` in one transaction so `total` matches)
  or `toPrismaPage(...)` from `src/infrastructure/core/repositories/prismaPagination.ts`. Give
  `orderBy` a default (`page.orderBy ?? { name: "asc" }`).
- Wrap every call in `try/catch`, `console.error` it, and rethrow `DatabaseError` (reads) or
  `DatabaseInsertError` (create / update / delete). **Always pass the original error as the second
  argument (`cause`)**: `errorHandler` looks for Prisma codes inside `cause` and maps `P2002` → 409,
  `P2003` → 409, `P2025` → 404. Without it those become 500.
- Do not check business rules here (uniqueness, "in use"); expose the query (`findByName`,
  `countUsages`) and let the service decide.

---

## Wiring

Register the repository in `src/dependencyInjection/container.ts` (no arguments: it uses the global
client):

```ts
export const categoryRepository = new PrismaCategoryRepository();
```

---

## Unit of work (transactions)

When one use case writes through several repositories, the domain declares an
`I{UseCase}UnitOfWork` and infrastructure implements it by building every repository on the same
transaction client:

```ts
// src/infrastructure/submissions/unitsOfWork/PrismaSubmissionApprovalUnitOfWork.ts
export class PrismaSubmissionApprovalUnitOfWork implements ISubmissionApprovalUnitOfWork {
  async runInTransaction<T>(work: (context: ISubmissionApprovalContext) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => {
      const context: ISubmissionApprovalContext = {
        getSubmissionRepository: () => new PrismaSubmissionRepository(tx),
        getPlaceRepository: () => new PrismaPlaceRepository(tx),
        // ...
      };
      return work(context);
    });
  }
}
```

MariaDB 11 note: a concurrent conditional `UPDATE` can fail with "Record has changed since last
read" instead of matching zero rows. Lock the row first (`SELECT ... FOR UPDATE`, see
`PrismaSubmissionRepository.findForUpdate`) when two requests can race on the same row.

---

## External providers

Third-party services (email, OAuth, push) implement a domain interface and wrap the SDK:

- Receive keys and config through the constructor (from `ENV` in `container.ts`), never read
  `process.env` inside the provider.
- Translate SDK failures into an `InfrastructureError` subclass (e.g. `EmailError`).
- Optional integrations must not break boot: if the config is missing, skip with one
  `console.warn` (see `AppleOAuthProvider.revokeToken`).

Example: `src/infrastructure/email/providers/ResendEmailProvider.ts` implements `IEmailService`.

---

## Variants

| Case | Example |
|---|---|
| UUID id generated by Prisma, enum and nullable columns, `Create{Model}Data` input | `PrismaSourceRepository` (`src/infrastructure/sources/`) |
| Id sent by the client; `include` of a relation into a read model | `PrismaProvinceRepository` (`src/infrastructure/geography/`) |
| Idempotent writes: `upsert` with `update: {}`, `deleteMany` that never 404s | `PrismaFavoriteRepository` (`src/infrastructure/favorites/`) |
| Owner-scoped write (`where: { id, userId }`) | `PrismaSubmissionRepository.deletePendingOwned` |
| `Decimal` columns, raw SQL (`$queryRaw`) for geo radius | `PrismaPlaceRepository`, `PrismaPlaceMapper` |
| `Json` column validated on read | `PrismaSubmissionMapper` |
