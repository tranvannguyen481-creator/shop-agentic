import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
} from "@/features/auth/constants/auth.constants";
import {
  completeProfileSchema,
  googleLoginSchema,
  registerSchema,
  sessionSchema,
  updateProfileSchema,
} from "@/features/auth/dtos/auth.dto";
import * as authService from "@/features/auth/services/auth.service";
import { AppError } from "@/shared/exceptions/AppError";
import type { CookieOptions, Request, Response } from "express";

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
  path: "/",
};

const clearAuthCookieOptions: CookieOptions = {
  ...authCookieOptions,
  maxAge: undefined,
};

export async function createSession(
  req: Request,
  res: Response,
): Promise<Response> {
  const parsedBody = sessionSchema.parse(req.body ?? {});
  const result = await authService.createSession(parsedBody.idToken);

  res.cookie(AUTH_COOKIE_NAME, parsedBody.idToken, authCookieOptions);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

export async function googleLogin(
  req: Request,
  res: Response,
): Promise<Response> {
  const parsedBody = googleLoginSchema.parse(req.body ?? {});
  const result = await authService.googleAuth(parsedBody.idToken);

  res.cookie(AUTH_COOKIE_NAME, parsedBody.idToken, authCookieOptions);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Login successful",
  });
}

export async function getMyProfile(
  req: Request,
  res: Response,
): Promise<Response> {
  const decodedToken = req.user;

  if (!decodedToken?.uid) {
    throw AppError.unauthorized();
  }

  const profile = await authService.getMyProfile(decodedToken);

  return res.status(200).json({
    success: true,
    data: { user: profile },
    message: "Success",
  });
}

export async function signOut(_req: Request, res: Response): Promise<Response> {
  res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);

  return res.status(200).json({
    success: true,
    data: null,
    message: "Success",
  });
}

export async function completeProfile(
  req: Request,
  res: Response,
): Promise<Response> {
  const parsedBody = completeProfileSchema.parse(req.body ?? {});
  const uid = req.user?.uid;

  if (!uid) {
    throw AppError.unauthorized();
  }

  const updatedUser = await authService.completeProfile(uid, parsedBody);

  return res.status(200).json({
    success: true,
    data: { user: updatedUser },
    message: "Profile completed",
  });
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<Response> {
  const parsedBody = updateProfileSchema.parse(req.body ?? {});
  const uid = req.user?.uid;

  if (!uid) {
    throw AppError.unauthorized();
  }

  const updatedUser = await authService.updateProfile(uid, parsedBody);

  return res.status(200).json({
    success: true,
    data: { user: updatedUser },
    message: "Profile updated",
  });
}

export async function register(
  req: Request,
  res: Response,
): Promise<Response> {
  const parsedBody = registerSchema.parse(req.body ?? {});
  const result = await authService.register(parsedBody);

  return res.status(201).json({
    success: true,
    data: result,
    message: "Registration successful",
  });
}
