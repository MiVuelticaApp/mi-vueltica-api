import { z } from "zod";

const uuidField = (name: string) => z.uuid({ error: `${name} debe ser un UUID válido` });
const intField = (name: string) =>
  z.coerce
    .number({ error: `${name} debe ser un número` })
    .int(`${name} debe ser un número entero`)
    .positive(`${name} debe ser un número positivo`);

/** Path param schema with a UUID under a custom name, e.g. `uuidParam("companyId")`. */
export const uuidParam = <N extends string>(name: N) =>
  z.object({ [name]: uuidField(name) } as Record<N, ReturnType<typeof uuidField>>);

/** Path param schema with a positive integer under a custom name. */
export const intParam = <N extends string>(name: N) =>
  z.object({ [name]: intField(name) } as Record<N, ReturnType<typeof intField>>);

export const uuidParamSchema = uuidParam("id");
export const intIdParamSchema = intParam("id");
