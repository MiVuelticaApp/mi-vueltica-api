---
name: Infrastructure Layer Generator
description: Rules and templates for generating infrastructure layer boilerplate with Prisma.
---

# Infrastructure Layer Code Generator

You are an expert in **Clean Architecture** and **Prisma ORM**.

Your task is to generate the **infrastructure layer boilerplate code** for a given model, following strict conventions.

---

## Folder Structure

For a given `{model}`, generate this structure:

/infrastructure/{model}/
- /repositories/Prisma{model}Repository.ts
- /mappers/Prisma{model}Mapper.ts

---

## Mapper Rules

The mapper is responsible for translating between Domain Entities and Prisma Persistence objects.

```ts
import { {model} } from "@/domain/{model}/entities/{model}";
import { {model} as Prisma{model} } from "@prisma/client";

export class Prisma{model}Mapper {
  static toDomain(row: Prisma{model}): {model} {
    return new {model}({
      id: row.id,
      // map other attributes
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  static toPersistence(entity: {model}): any {
    return {
      data: {
        id: entity.id,
        // map other attributes
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    };
  }
}
```

### Rules:
- Use `static` methods only.
- `toDomain` converts Prisma result (Persistence) to Domain Entity.
- `toPersistence` converts Domain Entity to Prisma update/create input.

---

## Repository Implementation Rules

Generate the repository implementation using Prisma:

```ts
import { {model} } from "@/domain/{model}/entities/{model}";
import { I{model}Repository } from "@/domain/{model}/repositories/I{model}Repository";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma{model}Mapper } from "../mappers/Prisma{model}Mapper";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";

export default class Prisma{model}Repository implements I{model}Repository {
  async all(): Promise<{model}[]> {
    try {
      const records = await prisma.{modelLowercase}.findMany();
      return records.map(Prisma{model}Mapper.toDomain);
    } catch (error) {
      throw new DatabaseError("Could not fetch {model} records");
    }
  }

  async create(entity: {model}): Promise<void> {
    try {
      await prisma.{modelLowercase}.create(Prisma{model}Mapper.toPersistence(entity));
    } catch (error) {
      throw new DatabaseError("Could not create {model}");
    }
  }

  async find(value: string, field: string = "id"): Promise<{model} | null> {
    try {
      const record = await prisma.{modelLowercase}.findFirst({
        where: { [field]: value }
      });
      return record ? Prisma{model}Mapper.toDomain(record) : null;
    } catch (error) {
      throw new DatabaseError("Could not find {model}");
    }
  }

  async update(entity: {model}): Promise<void> {
    try {
      await prisma.{modelLowercase}.update({
        where: { id: entity.id },
        data: Prisma{model}Mapper.toPersistence(entity).data
      });
    } catch (error) {
      throw new DatabaseError("Could not update {model}");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.{modelLowercase}.delete({ where: { id } });
    } catch (error) {
      throw new DatabaseError("Could not delete {model}");
    }
  }
}
```

### ✅ Rules:
- Always implement the interface from the Domain layer.
- Use `Prisma{model}Mapper` for all data transformations.
- Wrap all calls in `try/catch` and throw infrastructure-specific errors (e.g., `DatabaseError`).
- Use `prisma` client from `@/infrastructure/prisma/client`.

---

## Input Format

You will receive the model name and its attributes:

```json
{
  "model": "User",
  "attributes": [
    { "name": "id", "type": "string" },
    { "name": "email", "type": "string" }
  ]
}
```

---

## Output Requirements

- Generate ALL files (Repository and Mapper).
- Separate each file with its absolute path.
- No explanations, only code.

---

## Goal

Automate infrastructure boilerplate for Prisma while maintaining strict separation from the domain.
