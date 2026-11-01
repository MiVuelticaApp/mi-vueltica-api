import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import ApplicationError from "@/application/core/errors/ApplicationError";
import DomainError from "@/domain/core/errors/DomainError";

/**
 * Successful tool result: the payload goes both as `structuredContent` (validated against the
 * tool's `outputSchema`) and as a JSON text block for clients that ignore structured output.
 */
export function toolOk<T extends Record<string, unknown>>(payload: T): CallToolResult {
  return {
    structuredContent: payload,
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

/**
 * Failed tool result. Domain/application errors carry a user-facing message the model can act on;
 * anything else is logged and hidden behind a generic message.
 */
export function toolError(error: unknown): CallToolResult {
  if (error instanceof DomainError || error instanceof ApplicationError) {
    return { isError: true, content: [{ type: "text", text: error.message }] };
  }

  console.error("[mcp] Unhandled tool error:", error);
  return { isError: true, content: [{ type: "text", text: "Error interno del servidor" }] };
}

/** Failed tool result with a message written by the tool itself (e.g. a cross-field input rule). */
export function toolErrorMessage(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}
