import { z } from "zod";
import { VOTE_CHOICES } from "@/domain/moderation/moderationRules";

/** `for` publishes a suggestion / hides a reported plan; `against` rejects it / keeps the plan. */
export const VoteSchema = z.strictObject({
  choice: z.enum(VOTE_CHOICES, { message: `choice debe ser uno de: ${VOTE_CHOICES.join(", ")}` }),
});
