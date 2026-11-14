import z from "zod";

export const AcceptPrivacySchema = z.object({
  version: z.string({ message: "La versión es requerida" }).trim().min(1, { message: "La versión es requerida" }).max(32, { message: "La versión es muy larga" }),
});
