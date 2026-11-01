import { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServerFactory } from "../server/createMcpServer";

/**
 * Stateless Streamable HTTP: a fresh server + transport per request, no sessions kept in memory.
 */
export default class McpController {
  constructor(private readonly createServer: McpServerFactory) {}

  async handle(req: Request, res: Response): Promise<void> {
    const server = this.createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  methodNotAllowed(_req: Request, res: Response): void {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
  }
}
