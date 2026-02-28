import {
  createNotificationBodySchema,
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "@/features/notification/dtos/notification.dto";
import * as notificationService from "@/features/notification/services/notification.service";
import { AppError } from "@/shared/exceptions/AppError";
import type { Request, Response } from "express";

export async function listMyNotifications(
  req: Request,
  res: Response,
): Promise<Response> {
  const { page, pageSize, unreadOnly } = listNotificationsQuerySchema.parse(
    req.query ?? {},
  );
  if (!req.user) throw AppError.unauthorized();
  const result = await notificationService.listMyNotifications(req.user, {
    page,
    pageSize,
    unreadOnly,
  });
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function createNotification(
  req: Request,
  res: Response,
): Promise<Response> {
  const payload = createNotificationBodySchema.parse(req.body ?? {});
  if (!req.user) throw AppError.unauthorized();
  const result = await notificationService.createNotification(
    payload,
    req.user,
  );
  return res
    .status(201)
    .json({ success: true, data: result, message: "Success" });
}

export async function markAsRead(
  req: Request,
  res: Response,
): Promise<Response> {
  const { notificationId } = notificationIdParamsSchema.parse(req.params ?? {});
  if (!req.user) throw AppError.unauthorized();
  const result = await notificationService.markNotificationAsRead(
    notificationId,
    req.user,
  );
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function markAllAsRead(
  req: Request,
  res: Response,
): Promise<Response> {
  if (!req.user) throw AppError.unauthorized();
  const result = await notificationService.markAllNotificationsAsRead(req.user);
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}
