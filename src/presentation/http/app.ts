import express from "express";
import cors from "cors";
import morgan from "morgan";
import origins from "./core/config/origins";
import router from "./core/routes/router";
import errorHandler from "./core/middlewares/errorHandler";
import { apiReference } from "@scalar/express-api-reference";
import openApiDocument from "./core/docs/openapi";
import ENV from "./core/config/env";
import mcpRouter from "@/presentation/mcp/routes/mcp.routes";

const app = express();

// Trust exactly the reverse proxies in front of the API (TRUST_PROXY, default 1), never every hop (#4).
app.set("trust proxy", ENV.TRUST_PROXY);

// Logging
app.use(morgan("dev"));

// CORS config
app.use(
  cors({
    origin: origins,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    // `X-Device-Id` identifies guests on verifications and reports; without it browsers reject the preflight (web app).
    allowedHeaders: "Content-Type, Authorization, X-Device-Id",
  })
);

// Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// API docs (Scalar). Disabled in production so the endpoint surface isn't public.
if (ENV.NODE_ENV !== "production") {
  app.get("/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });
  app.use("/docs", apiReference({ url: "/openapi.json" }));
}

// MCP endpoint (Streamable HTTP, stateless)
app.use("/mcp", mcpRouter);

// API routes
app.use("/api/v1", router);

app.use(errorHandler);

export default app;
