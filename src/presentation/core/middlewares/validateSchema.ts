import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

function validateSchema(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.safeParse(req.body);
    if (error) {
      console.log("Schema validation error:", error);
      console.log(req.body);
      res.status(400).json({ message: error.issues[0].message });
      return;
    }
    next();
  };
}

export default validateSchema;
