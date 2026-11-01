import express from "express";
import cors from "cors";
import morgan from "morgan";
import origins from "./core/config/origins";
import router from "./core/routes/router";
import errorHandler from "./core/middlewares/errorHandler";
import { apiReference } from "@scalar/express-api-reference";
import openApiDocument from "./core/docs/openapi";
import ENV from "./core/config/env";

const app = express();

// Trust reverse proxy
app.set("trust proxy", true);

// Logging
app.use(morgan("dev"));

// CORS config
app.use(
  cors({
    origin: origins,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Authorization",
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

// API routes
app.use("/api/v1", router);

app.use(errorHandler);

export default app;
