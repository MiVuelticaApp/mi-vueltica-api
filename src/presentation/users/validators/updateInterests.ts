import { z } from "zod";

const updateInterestsSchema = z.object({
  interestsIds: z.array(z.string())
});

export default updateInterestsSchema;