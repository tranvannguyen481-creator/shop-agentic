import logger from "@/shared/utils/logger";
import type { NextFunction, Request, Response } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
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
};
