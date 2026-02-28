import "dotenv/config";
import "express-async-errors";

import compression from "compression";
import cors from "cors";
import { randomUUID } from "crypto";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ZodError } from "zod";

import { AppError } from "@/shared/exceptions/AppError";
import logger from "@/shared/utils/logger";

// Feature routers
import authRouter from "@/features/auth";
import eventRouter from "@/features/event";
import groupRouter from "@/features/group";
import notificationRouter from "@/features/notification";
import orderRouter from "@/features/order";
import testRouter from "@/features/test";
import uploadRouter from "@/features/upload";

const app = express();

// ─── Security & Compression ──────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: process.env["ALLOWED_ORIGINS"]?.split(",").map((o) => o.trim()) ?? [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  }),
);
app.use(compression());

// ─── Rate Limiting ───────────────────────────────────────────────────────────

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: "TOO_MANY_REQUESTS",
      message: "Too many requests, please try again later.",
    },
  }),
);

// ─── Body Parsing ────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Static Files ────────────────────────────────────────────────────────────

app.use("/images", express.static("public/images"));

// ─── Request ID Middleware ───────────────────────────────────────────────────

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.requestId = randomUUID();
  next();
});

// ─── HTTP Request Logging ────────────────────────────────────────────────────

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.http(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
      {
        requestId: req.requestId,
        ip: req.ip,
      },
    );
  });
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/test", testRouter);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res
    .status(404)
    .json({ success: false, error: "NOT_FOUND", message: "Route not found" });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  // ZodError → 422 Unprocessable Entity
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "Validation failed",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  // AppError → structured response
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.statusCode}]: ${err.message}`, {
      requestId: req.requestId,
      errorCode: err.errorCode,
    });
    return res.status(err.statusCode).json({
      success: false,
      error: err.errorCode,
      message: err.message,
      ...(err.details !== undefined && { details: err.details }),
    });
  }

  // Unknown error → 500
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error(`Unhandled error: ${message}`, {
    requestId: req.requestId,
    stack: err instanceof Error ? err.stack : undefined,
  });

  return res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message:
      process.env["NODE_ENV"] === "production"
        ? "Internal server error"
        : message,
  });
});

export default app;
