---
name: Application Layer Generator
description: Rules and templates for the application layer (services and application errors).
---

# Application Layer

The application layer orchestrates the use cases: it loads entities through the repository
interfaces, applies the business rules, and throws application errors that the HTTP layer turns
into status codes. It imports from `domain` only (never from `infrastructure` or `presentation`).

Reference implementation: the `categories` module (`src/application/categories/`). For other cases,
see "Variants" at the end.

---

## Folder structure

```
src/application/{module}/
  services/interfaces/I{Model}Service.ts
  services/implementations/{Model}Service.ts
  errors/{Model}NotFoundError.ts
  errors/{Model}AlreadyExistsError.ts      # only if there is a uniqueness rule
  errors/{Model}InUseError.ts              # only if a delete can be blocked
```

---

## Service interface

```ts
// src/application/categories/services/interfaces/ICategoryService.ts
import { Category } from "@/domain/categories/entities/Category";
import { CategoryListFilters } from "@/domain/categories/repositories/ICategoryRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface ICategoryService {
  list(params: PaginationParams, filters?: CategoryListFilters): Promise<PaginatedResult<Category>>;
  get(id: number): Promise<Category>;
  create(name: string): Promise<Category>;
  update(id: number, name: string): Promise<Category>;
  delete(id: number): Promise<void>;
}
```

Rules:
- Services take and return domain entities and plain data, never HTTP requests/responses or Prisma
  types.
- With more than one or two input fields, declare an input interface next to the service interface
  (`SourceInput`, `CreateProvinceInput`).

---

## Service implementation

```ts
// src/application/categories/services/implementations/CategoryService.ts
import { Category } from "@/domain/categories/entities/Category";
import { CategoryName } from "@/domain/categories/valueObjects/categoryName.valueObject";
import { CategoryListFilters, ICategoryRepository } from "@/domain/categories/repositories/ICategoryRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { ICategoryService } from "../interfaces/ICategoryService";
import { CategoryNotFoundError } from "../../errors/CategoryNotFoundError";
import { CategoryAlreadyExistsError } from "../../errors/CategoryAlreadyExistsError";
import { CategoryInUseError } from "../../errors/CategoryInUseError";

export class CategoryService implements ICategoryService {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async list(params: PaginationParams, filters?: CategoryListFilters): Promise<PaginatedResult<Category>> {
    return this.categoryRepository.list(params, filters);
  }

  async get(id: number): Promise<Category> {
    const category = await this.categoryRepository.find(id);
    if (!category) throw new CategoryNotFoundError();
    return category;
  }

  async create(name: string): Promise<Category> {
    const normalized = CategoryName.create(name).value;
    const existing = await this.categoryRepository.findByName(normalized);
    if (existing) throw new CategoryAlreadyExistsError();
    return this.categoryRepository.create(normalized);
  }

  async update(id: number, name: string): Promise<Category> {
    const category = await this.get(id);
    category.rename(name);

    const existing = await this.categoryRepository.findByName(category.name);
    if (existing && existing.id !== id) throw new CategoryAlreadyExistsError();

    await this.categoryRepository.update(category);
    return this.get(id);
  }

  async delete(id: number): Promise<void> {
    await this.get(id);
    const usage = await this.categoryRepository.countUsages(id);
    if (usage.places > 0 || usage.events > 0) throw new CategoryInUseError();
    await this.categoryRepository.delete(id);
  }
}
```

Rules:
- Depend on repository **interfaces** from the domain, injected through the constructor.
- `get(id)` throws `{Model}NotFoundError`; reuse it in `update` and `delete` so all three return 404
  the same way.
- Validate through the value objects / entity **before** touching the database (a 400 should never
  cost a query).
- `update` changes the entity through its methods (`rename`), saves, then **re-reads** with
  `this.get(id)` so the response has the values the database set (`updatedAt`, defaults).
- Check uniqueness and "in use" explicitly to return a clear 409. The DB constraint is still the last
  line of defense: a concurrent insert that slips past the check fails with Prisma `P2002`, which
  `errorHandler` also maps to 409.
- Referenced ids that do not exist (`categoryId`, `placeId`) are a **422**
  (`Invalid{Reference}Error`), not a 404: the URL is fine, the body points to something missing.
  Example: `PlaceService` (`InvalidCantonError`, `InvalidCategoryError`, `InvalidSourceError`).

---

## Application errors

```ts
// src/application/categories/errors/CategoryNotFoundError.ts
import ApplicationError from "@/application/core/errors/ApplicationError";

export class CategoryNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Categoría no encontrada");
    this.name = "CategoryNotFoundError";
    this.stack = new Error().stack;
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}
```

Rules:
- Always extend `ApplicationError`. `errorHandler` only uses `statusCode` and `message` for
  `ApplicationError` / `DomainError` / `InfrastructureError`; a plain `Error` becomes a generic 500.
- Default message in Spanish (it reaches the client), overridable through the constructor.
- Usual status codes: 404 `NotFound`, 409 `AlreadyExists` / `InUse` / invalid state (`SubmissionNotPendingError`),
  422 `Invalid{Reference}`, 403 `SelfModificationError`. Reuse the shared ones in
  `src/application/core/errors/` (`UnauthorizedError` 401, `ForbiddenError` 403).

---

## Wiring

Register the service in `src/dependencyInjection/container.ts`, after its repository:

```ts
export const categoryRepository = new PrismaCategoryRepository();
export const categoryService = new CategoryService(categoryRepository);
```

---

## Variants

| Case | Example |
|---|---|
| Input interface, partial update (`undefined` keeps, `null` clears), extra use case (`markCrawled`) | `SourceService` (`src/application/sources/`) |
| Id sent by the client; 409 with a specific message per field (`withId()` / `withName()`) | `ProvinceService` (`src/application/geography/`) |
| Resource owned by a user: every method takes `userId`; someone else's resource is a **404** (do not reveal it exists) | `SubmissionService.getMine` / `deleteMine` (`src/application/submissions/`) |
| Checks on referenced ids (422) | `PlaceService.create` / `update` (`src/application/places/`) |
| Visibility by role (`statuses?: ContentStatus[]` from the controller) | `PlaceService`, `EventService` |
| Several writes in one transaction | `SubmissionService.approve` (unit of work), `AccountDeletionService` |
| Idempotent writes (no 409 on repeat) | `FavoriteService` (`src/application/favorites/`) |
