import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export type ValidationSource = "body" | "query" | "params";

/**
 * Validates `req[source]` against a Zod schema. On success the parsed output (defaults,
 * coercions, transforms applied) is stored in `req.validated[source]`; read it with
 * `getValidated`. `req.query` is a read-only getter in Express 5, so it is never reassigned;
 * `req.body` is also replaced with the parsed output.
 */
function validateSchema(schema: ZodType, source: ValidationSource = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({ message: result.error.issues[0].message });
      return;
    }

    req.validated = { ...req.validated, [source]: result.data };
    if (source === "body") req.body = result.data;
    next();
  };
}

/** Returns the output of a previous `validateSchema(schema, source)` for this request. */
export function getValidated<T>(req: Request, source: ValidationSource): T {
  const data = req.validated?.[source];
  if (data === undefined) {
    throw new Error(`No validated ${source} found: add validateSchema(schema, "${source}") to the route`);
  }
  return data as T;
}

export default validateSchema;
