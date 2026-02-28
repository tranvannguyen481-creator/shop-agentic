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

import { globalErrorHandler } from "@/app/middleware/error-handler";
import { requestLogger } from "@/app/middleware/request-logger";

// Feature routers
import authRouter from "@/features/auth";
import eventRouter from "@/features/event";
import groupRouter from "@/features/group";
import notificationRouter from "@/features/notification";
import orderRouter from "@/features/order";
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
    max: process.env.NODE_ENV === "production" ? 300 : 2000,
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

app.use(requestLogger);

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/upload", uploadRouter);

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

app.use(globalErrorHandler);

export default app;
