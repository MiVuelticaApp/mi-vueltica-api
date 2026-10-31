import { z } from "zod";

export const TestLoginSchema = z.object({
  email: z.string({
    message: "El correo es requerido",
  }).min(1, {
    message: "El correo no puede estar vacío",
  }),
  password: z.string({
    message: "La contraseña es requerida",
  }).min(1, {
    message: "La contraseña no puede estar vacía",
  }),
});
