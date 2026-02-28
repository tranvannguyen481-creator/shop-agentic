import { AUTH_COOKIE_NAME } from "@/features/auth/constants/auth.constants";
import { verifyIdToken } from "@/features/auth/services/auth.service";
import { AppError } from "@/shared/exceptions/AppError";
import type { NextFunction, Request, Response } from "express";

const getCookieValue = (
  cookieHeader: string | undefined,
  cookieName: string,
): string => {
  if (!cookieHeader) return "";

  const targetPrefix = `${cookieName}=`;
  const cookieEntry = cookieHeader
    .split(";")
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith(targetPrefix));

  if (!cookieEntry) return "";
  return decodeURIComponent(cookieEntry.slice(targetPrefix.length));
};

const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const cookieToken = getCookieValue(req.headers.cookie, AUTH_COOKIE_NAME);
  const authHeader = req.headers.authorization ?? "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";
  const idToken = cookieToken || bearerToken;

  if (!idToken) {
    return next(AppError.unauthorized("No authentication token provided"));
  }

  req.user = await verifyIdToken(idToken);
  next();
};

export default authMiddleware;
