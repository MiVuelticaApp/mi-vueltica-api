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
import { DEVICE_ID_HEADER } from "@/presentation/http/community/utils/person";

const app = express();

// Trust reverse proxy
app.set("trust proxy", true);

// Logging
app.use(morgan("dev"));

// CORS (browser clients only; native apps send no Origin). Allowed origins come from CORS_ORIGINS.
// X-Device-Id identifies guests on community verifications / reports and the detail GETs.
app.use(
  cors({
    origin: origins,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization", DEVICE_ID_HEADER],
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
