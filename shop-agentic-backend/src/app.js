require("express-async-errors");
require("dotenv").config();

const path = require("path");
const { randomUUID } = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { createLogger, format, transports } = require("winston");
const app = express();

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "10mb";
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(helmet());
app.use(compression());
app.use(apiLimiter);
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));

// Static files: images served at /images
app.use("/images", express.static(path.join(__dirname, "../public/images")));

app.use((req, res, next) => {
  const incomingRequestId = req.headers["x-request-id"];
  const requestId =
    typeof incomingRequestId === "string" && incomingRequestId.trim()
      ? incomingRequestId.trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

app.use((req, res, next) => {
  const startTime = process.hrtime.bigint();

  logger.info({
    message: "Request started",
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
  });

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    const level = res.statusCode >= 500 ? "error" : "info";

    logger.log({
      level,
      message: "Request completed",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      contentLength: res.getHeader("content-length") || null,
    });
  });

  next();
});

const authRoutes = require("./features/auth");
const eventRoutes = require("./features/event");
const groupRoutes = require("./features/group");
const notificationRoutes = require("./features/notification");
const testRoutes = require("./features/test");
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/test", testRoutes);

app.use((error, _req, res, _next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message:
        "Request payload is too large. Please reduce image size and try again.",
      requestId: _req.requestId || null,
    });
  }

  const statusCode = Number(error.statusCode || error.status || 500);

  logger.error({
    message: error.message || "Unexpected backend error",
    requestId: _req.requestId,
    path: _req.originalUrl,
    method: _req.method,
    statusCode,
    stack: error.stack,
  });

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal Server Error",
    requestId: _req.requestId || null,
  });
});

module.exports = app;
