---
name: Infrastructure Standard (Prisma)
description: Guidelines for implementing the infrastructure layer using Prisma ORM.
---

# Infrastructure Standard (Prisma)

The infrastructure layer interacts with the database using **Prisma ORM**. All implementations must be strictly decoupled from the domain logic using the **Repository Pattern** and **Data Mappers**.

## 🧱 Repository Pattern (Prisma Implementation)

All repositories must implement an interface defined in the domain layer.

- **Client**: Use the global `prisma` client from `@/infrastructure/prisma/client`.
- **Transformation**: ALWAYS use a Mapper (`Prisma{model}Mapper`) to transform data between Domain Entities and Prisma Persistence objects.
- **Error Handling**: Wrap all infrastructure calls in `try/catch` blocks and re-throw as infrastructure-specific exceptions (e.g., `DatabaseError`).

### Example Repository Method
```typescript
async find(id: string): Promise<User | null> {
  try {
    const record = await prisma.user.findUnique({ where: { id } });
    return record ? PrismaUserMapper.toDomain(record) : null;
  } catch (error) {
    throw new DatabaseError("Database search failed");
  }
}
```

## 🗺️ Data Mapping

Mappers are the bridge between the domain and the infrastructure.

- **`toDomain`**: Static method that converts a Prisma record into a Domain Entity.
- **`toPersistence`**: Static method that converts a Domain Entity into a Prisma input object (e.g., `UserCreateInput`).
- **Dependencies**: Mappers for complex entities should call other mappers for nested objects when necessary.

## 🔌 External Service Clients

When an infrastructure module needs to call an external API:
- Create a dedicated client that encapsulates the library (e.g., axios/fetch).
- Abstract authentication and base URLs.
- Translate external errors into domain exceptions via the repository.

## ⚠️ Error Handling

Avoid exposing raw Prisma/DB errors to the upper layers.
- Default to `DatabaseError` for general issues.
- Use `DatabaseInsertError` or `DatabaseUpdateError` if more precision is needed for the business logic.

## 🧪 Testing

- Infrastructure components should be tested against a real (test) database or using a Prisma mock if appropriate for unit testing.
- Integration tests must ensure the schema matches the entities' expectations.
