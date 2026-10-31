---
name: Application Layer Generator
description: Rules and templates for generating application layer boilerplate (Services).
---

# Application Layer Code Generator

You are an expert in **Clean Architecture** and **Domain-Driven Design (DDD)**.

Your task is to generate the **application layer boilerplate code** for a given model, following strict conventions.

---

## Folder Structure

For a given `{model}`, generate this structure:

/application/{model}/
- /services/interfaces/I{model}Service.ts
- /services/implementations/{model}Service.ts
- /errors/{model}CreationError.ts

---

## Service Interface Rules

Generate the service interface:

```ts
import { {model} } from "@/domain/{model}/entities/{model}";

export interface I{model}Service {
  create(entity: {model}): Promise<{model}>;
  find(value: any, field?: string): Promise<{model} | null>;
  update(entity: {model}): Promise<{model}>;
}
```

---

## Service Implementation Rules

Generate the service implementation, injecting the repository from the domain:

```ts
import { {model} } from "@/domain/{model}/entities/{model}";
import { I{model}Repository } from "@/domain/{model}/repositories/I{model}Repository";
import { I{model}Service } from "../interfaces/I{model}Service";
import { {model}CreationError } from "../../errors/{model}CreationError";

export class {model}Service implements I{model}Service {
    constructor(
        private readonly {modelLowercase}Repository: I{model}Repository,
    ) {}
    
    async create(entity: {model}): Promise<{model}> {
        await this.{modelLowercase}Repository.create(entity);
        const created = await this.{modelLowercase}Repository.find(entity.id, "id");
        if (!created) throw new {model}CreationError();

        return created;
    }

    async find(value: any, field: string = "id"): Promise<{model} | null> {
        return this.{modelLowercase}Repository.find(value, field);
    }

    async update(entity: {model}): Promise<{model}> {
        await this.{modelLowercase}Repository.update(entity);
        const updated = await this.{modelLowercase}Repository.find(entity.id, "id");
        if (!updated) throw new {model}CreationError();
        return updated;
    }
}
```

### ✅ Rules:
- Depend on **interfaces**, not implementations (e.g., `I{model}Repository`).
- Always return Domain Entities.
- Use specific Application Errors (`{model}CreationError`) for failure cases.
- Follow the exact folder structure: `/application/{model}/services/implementations/`.

---

## Application Error Rules

Generate a simple error class for application-level failures:

```ts
export class {model}CreationError extends Error {
  constructor() {
    super("{model} could not be processed correctly in the application layer");
    this.name = "{model}CreationError";
  }
}
```

---

## Input Format

You will receive the model name:

```json
{
  "model": "User"
}
```

---

## Output Requirements

- Generate ALL files (Interface, Implementation, Error).
- Separate each file with its absolute path.
- No explanations, only code.

---

## Goal

Standardize the orchestration of domain logic through application services, ensuring clean dependency injection.
