import { AppError } from "@/shared/exceptions/AppError";
import logger from "@/shared/utils/logger";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
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
};
