---
name: Presentation Layer Generator
description: Rules and templates for generating presentation layer boilerplate (Controllers, Routes, Mappers, etc.).
---

# Presentation Layer Code Generator

You are an expert in **Express.js**, **Clean Architecture**, and **Zod**.

Your task is to generate the **presentation layer boilerplate code** for a given model, following strict conventions.

---

## Folder Structure

For a given `{model}`, generate this structure:

/presentation/http/{model}/
- /controllers/{model}.controller.ts
- /routes/{model}.routes.ts
- /mappers/{model}.mapper.ts
- /requests/Create{model}Request.ts
- /responses/{model}Response.ts
- /validators/{modelLowercase}.validator.ts

---

## Route Rules

Generate the Express router:

```ts
import { Router } from "express";
import { {modelLowercase}Controller } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { Create{model}Schema } from "../validators/{modelLowercase}.validator";

const {modelLowercase}Router = Router();

{modelLowercase}Router.use(jwtAuth);
{modelLowercase}Router.post("/", validateSchema(Create{model}Schema), asyncHandler({modelLowercase}Controller.create.bind({modelLowercase}Controller)));
{modelLowercase}Router.get("/:id", asyncHandler({modelLowercase}Controller.get.bind({modelLowercase}Controller)));

export default {modelLowercase}Router;
```

---

## Controller Rules

Generate the controller with dependency injection:

```ts
import { Request, Response } from "express";
import { I{model}Service } from "@/application/{model}/services/interfaces/I{model}Service";
import {model}Mapper from "../mappers/{model}.mapper";

export default class {model}Controller {
  constructor(private readonly {modelLowercase}Service: I{model}Service) {}

  async create(req: Request, res: Response): Promise<void> {
    const entity = {model}Mapper.toEntity(req.body);
    const created = await this.{modelLowercase}Service.create(entity);
    res.status(201).json({model}Mapper.toResponse(created));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const entity = await this.{modelLowercase}Service.find(id);
    if (!entity) {
      res.status(404).json({ message: "{model} not found" });
      return;
    }
    res.json({model}Mapper.toResponse(entity));
  }
}
```

---

## Mapper Rules

Generate the presentation mapper:

```ts
import { {model} } from "@/domain/{model}/entities/{model}";
import { Create{model}Request } from "../requests/Create{model}Request";
import { {model}Response } from "../responses/{model}Response";

export default class {model}Mapper {
  static toEntity(request: Create{model}Request): {model} {
    return new {model}({
      id: "", // Usually generated or handled in application/domain
      ...request
    });
  }

  static toResponse(entity: {model}): {model}Response {
    return {
      id: entity.id,
      // map other fields
    };
  }
}
```

---

## Validator Rules (Zod)

Generate the Zod schema:

```ts
import z from "zod";

export const Create{model}Schema = z.object({
  // define attributes here
});
```

---

## Input Format

You will receive the model name and attributes:

```json
{
  "model": "User",
  "attributes": [
    { "name": "name", "type": "string" },
    { "name": "email", "type": "string" }
  ]
}
```

---

## Output Requirements

- Generate ALL files in the specified structure.
- Use absolute paths for each file.
- No explanations, only code.

---

## Goal

Standardize the interface between external requests and application logic, ensuring robust validation and clean data mapping.
