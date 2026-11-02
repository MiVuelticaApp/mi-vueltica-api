---
name: Presentation Layer Generator
description: Rules and templates for the HTTP presentation layer (routes, controllers, validators, DTOs, mappers, OpenAPI).
---

# Presentation Layer (HTTP)

The HTTP adapter translates requests into service calls and entities into responses. It holds no
business rules: validation of shape (Zod), authentication/authorization (middlewares), mapping and
status codes only. The MCP adapter (`src/presentation/mcp/`) is a second adapter over the same
services; see AGENTS.md.

Reference implementation: the `categories` module (`src/presentation/http/categories/`). For other
cases, see "Variants" at the end.

---

## Folder structure

```
src/presentation/http/{module}/
  controllers/{Model}.controller.ts
  routes/{module}.routes.ts
  validators/create{Model}.ts            # one file per action: create, update, list, ...
  validators/update{Model}.ts
  validators/list{Models}.ts
  requests/Create{Model}Request.ts       # plain interfaces for the validated body
  requests/Update{Model}Request.ts
  responses/{Model}Response.ts
  mappers/{Model}.mapper.ts
```

---

## Validators (Zod)

```ts
// validators/createCategory.ts
import z from "zod";
import { CATEGORY_NAME_MAX_LENGTH } from "@/domain/categories/valueObjects/categoryName.valueObject";

export const categoryNameField = z
  .string({ error: "El nombre es requerido" })
  .trim()
  .min(1, { message: "El nombre es requerido" })
  .max(CATEGORY_NAME_MAX_LENGTH, { message: `El nombre no puede exceder ${CATEGORY_NAME_MAX_LENGTH} caracteres` });

export const CreateCategorySchema = z.object({ name: categoryNameField });
```

```ts
// validators/listCategories.ts
import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";

export const CATEGORY_SORT_FIELDS = ["id", "name"] as const;

export const ListCategoriesQuerySchema = createPaginationQuerySchema(CATEGORY_SORT_FIELDS).extend({
  search: z.string().trim().max(100, { message: "La búsqueda no puede exceder 100 caracteres" }).optional(),
});
```

Rules:
- Zod 4 syntax: `{ error: "..." }` / `{ message: "..." }`; error messages in Spanish.
- Import limits from the domain value objects so Zod and the domain agree.
- Share field schemas between create/update (`categoryNameField`); `update` is a full replace (PUT).
- Lists: `createPaginationQuerySchema(SORT_FIELDS)` (page, pageSize, whitelisted `sort`), then
  `.extend()` for filters. Export `SORT_FIELDS` so OpenAPI can reuse it.
- Path params: `uuidParamSchema` / `intIdParamSchema` (or `uuidParam("placeId")`) from
  `src/presentation/http/core/validators/params.ts`.
- Request/response interfaces are plain TypeScript (`requests/`, `responses/`); no classes.

---

## Mapper and DTOs

```ts
// mappers/Category.mapper.ts
export default class CategoryDtoMapper {
  static toResponse(category: Category): CategoryResponse {
    return { id: category.id, name: category.name };
  }
}
```

Rules:
- Static methods; entity → response only (requests are already validated plain data).
- Dates go out as ISO strings (`date.toISOString()`), nullable dates as `null`.
- Never expose internal fields (`ssoSubject`, `aiScore` outside moderation responses).

---

## Controller

```ts
// controllers/Category.controller.ts
type ListQuery = z.output<typeof ListCategoriesQuerySchema>;
type IdParams = { id: number };

export default class CategoryController {
  constructor(private readonly categoryService: ICategoryService) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.categoryService.list(toPaginationParams(query), { search: query.search || undefined });
    res.json(toPaginatedResponse(result, CategoryDtoMapper.toResponse));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    res.json(CategoryDtoMapper.toResponse(await this.categoryService.get(id)));
  }

  async create(req: Request, res: Response): Promise<void> {
    const { name }: CreateCategoryRequest = req.body;
    res.status(201).json(CategoryDtoMapper.toResponse(await this.categoryService.create(name)));
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const { name }: UpdateCategoryRequest = req.body;
    res.json(CategoryDtoMapper.toResponse(await this.categoryService.update(id, name)));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    await this.categoryService.delete(id);
    res.status(204).send();
  }
}
```

Rules:
- Depend on the service **interface**, injected through the constructor.
- **No `try/catch`**: errors propagate through `asyncHandler` to `errorHandler`, which maps them by
  `statusCode`. Do not build 404 responses by hand; the service throws `NotFoundError`.
- Read validated input with `getValidated<T>(req, "query" | "params")` (Express 5's `req.query` is
  read-only; `validateSchema` stores the parsed output in `req.validated`). The body is `req.body`.
- Authenticated user: `getAuthUser(req)` (`const { id: userId } = getAuthUser(req)`).
- Status codes: 201 on create, 204 (no body) on delete, 200 otherwise.
- Lists: `toPaginatedResponse(result, mapItem)` → `{ data, page, pageSize, total }`.

---

## Routes

```ts
// routes/categories.routes.ts
const categoriesRouter = Router();

// Public reads
categoriesRouter.get("/", validateSchema(ListCategoriesQuerySchema, "query"), asyncHandler(categoryController.list.bind(categoryController)));
categoriesRouter.get("/:id", validateSchema(intIdParamSchema, "params"), asyncHandler(categoryController.get.bind(categoryController)));

// Admin writes
categoriesRouter.post("/", jwtAuth, requireRole("ADMIN"), validateSchema(CreateCategorySchema), asyncHandler(categoryController.create.bind(categoryController)));
categoriesRouter.put("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(intIdParamSchema, "params"), validateSchema(UpdateCategorySchema), asyncHandler(categoryController.update.bind(categoryController)));
categoriesRouter.delete("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(intIdParamSchema, "params"), asyncHandler(categoryController.delete.bind(categoryController)));

export default categoriesRouter;
```

Rules:
- Middleware order per route: `jwtAuth` → `requireRole(...)` → `validateSchema(...)` →
  `asyncHandler(controller.method.bind(controller))`. `requireRole` always comes after `jwtAuth`.
- Put the middleware on each route (reads are often public) instead of `router.use(jwtAuth)`; use
  `router.use(jwtAuth)` only when every route in the file is authenticated (`/me/...` routers).
- Public reads that change for logged-in users use `optionalJwtAuth`.
- Validate params and query/body with `validateSchema(schema, "params" | "query" | "body")`.
- Rate-limit sensitive routes with `rateLimit(...)`; per user with `keyGenerator: byUserId`.

---

## Wiring (all three are required)

1. **Controller** in `src/dependencyInjection/container.ts`, after its service:
   ```ts
   export const categoryController = new CategoryController(categoryService);
   ```
2. **Router** in `src/presentation/http/core/routes/router.ts`. Mount more specific paths first
   (`/me/submissions` before `/me`, `/places/:placeId/favorite` before `/places`) so they are not
   shadowed.
3. **OpenAPI** in `src/presentation/http/core/docs/openapi.ts`: the paths (with every status code
   the route can return), the response schema in `components.schemas`, and the tag in `tags`.
   Request bodies come from the Zod schema with `jsonBody(Schema)`; use the shared
   `components.parameters` (`Page`, `PageSize`, `UuidId`, `IntId`) and `components.responses`
   (`BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `UnprocessableEntity`).
   **Response schemas are hand-written: keep them in sync with `responses/*.ts`.**

Then document business rules in AGENTS.md (one section per module: endpoints, auth, rules, error
classes).

---

## Variants

| Case | Example |
|---|---|
| UUID ids (`uuidParamSchema`), enum filters, ISO dates in responses | `sources/` |
| Id sent by the client, `include` option, `setPublicCache(res)` on public reference data | `geography/` |
| Resource owned by the user: whole router behind `jwtAuth`, mounted under `/me/...`, `getAuthUser`, service methods take `userId` | `submissions/routes/mySubmissions.routes.ts` |
| Sub-resource with a parent id (`Router({ mergeParams: true })`, `uuidParam("placeId")`) | `favorites/routes/placeFavorite.routes.ts` |
| Optional auth and visibility by role (controller passes `statuses`) | `places/`, `events/` |
| Moderation actions (`POST /:id/approve`, `PATCH /:id/status`) | `submissions/`, `places/` |
| Union body (`z.discriminatedUnion`) | `submissions/validators/createSubmission.ts` |
| Same service exposed to LLM clients | `src/presentation/mcp/tools/categories.tools.ts` |
