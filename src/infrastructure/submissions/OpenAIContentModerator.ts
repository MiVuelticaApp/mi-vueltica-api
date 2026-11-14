import { IContentModerator, ModerationVerdict } from "@/domain/submissions/services/IContentModerator";

const ENDPOINT = "https://api.openai.com/v1/moderations";
const TIMEOUT_MS = 8000;

interface ModerationResponse {
  results?: { flagged: boolean; categories: Record<string, boolean>; category_scores: Record<string, number> }[];
}

/**
 * OpenAI's moderation endpoint (free; `omni-moderation-latest`, which handles Spanish). Score = the highest category
 * score; reasons = the categories it flagged. Fails open: no key, a timeout or any error returns null and the
 * suggestion goes to the human queue as before. Never logs the text.
 */
export class OpenAIContentModerator implements IContentModerator {
  private warned = false;

  constructor(private readonly apiKey: string, private readonly model = "omni-moderation-latest") {}

  async check(text: string): Promise<ModerationVerdict | null> {
    if (!this.apiKey) {
      if (!this.warned) console.warn("[ai-moderation] AI_MODERATION_API_KEY is not set: only the local spam check runs");
      this.warned = true;
      return null;
    }
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ model: this.model, input: text }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        console.warn(`[ai-moderation] moderation API answered ${res.status}`);
        return null;
      }
      const result = ((await res.json()) as ModerationResponse).results?.[0];
      if (!result) return null;
      const scores = Object.values(result.category_scores ?? {});
      return {
        score: scores.length ? Math.min(1, Math.max(0, ...scores)) : 0,
        reasons: Object.entries(result.categories ?? {}).filter(([, on]) => on).map(([k]) => k),
      };
    } catch (error) {
      console.warn(`[ai-moderation] moderation API failed: ${(error as Error).name}`);
      return null;
    }
  }
}
