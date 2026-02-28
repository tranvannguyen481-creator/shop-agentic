import {
  calculateOrderSchema,
  listOrdersQuerySchema,
  orderIdParamsSchema,
  placeOrderSchema,
} from "@/features/order/dtos/order.dto";
import * as orderService from "@/features/order/services/order.service";
import { AppError } from "@/shared/exceptions/AppError";
import type { Request, Response } from "express";

export async function calculateOrder(
  req: Request,
  res: Response,
): Promise<Response> {
  if (!req.user) throw AppError.unauthorized();
  const body = calculateOrderSchema.parse(req.body ?? {});
  const result = await orderService.calculateOrder(req.user, body);
  return res
    .status(200)
    .json({ success: true, data: result, message: "Tính tiền thành công" });
}

export async function placeOrder(
  req: Request,
  res: Response,
): Promise<Response> {
  if (!req.user) throw AppError.unauthorized();
  const body = placeOrderSchema.parse(req.body ?? {});
  const result = await orderService.placeOrder(req.user, body);
  return res
    .status(201)
    .json({ success: true, data: result, message: "Đặt hàng thành công" });
}

export async function getOrderDetail(
  req: Request,
  res: Response,
): Promise<Response> {
  if (!req.user) throw AppError.unauthorized();
  const { orderId } = orderIdParamsSchema.parse(req.params ?? {});
  const result = await orderService.getOrderDetail(req.user, orderId);
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function listMyOrders(
  req: Request,
  res: Response,
): Promise<Response> {
  if (!req.user) throw AppError.unauthorized();
  const { page, pageSize, eventId, status } = listOrdersQuerySchema.parse(
    req.query ?? {},
  );
  const result = await orderService.listMyOrders(req.user, {
    page,
    pageSize,
    eventId,
    status,
  });
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function listEventOrders(
  req: Request,
  res: Response,
): Promise<Response> {
  if (!req.user) throw AppError.unauthorized();
  const eventId = req.params["eventId"] as string;
  if (!eventId) throw AppError.badRequest("eventId is required");
  const result = await orderService.listEventOrders(req.user, eventId);
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}
