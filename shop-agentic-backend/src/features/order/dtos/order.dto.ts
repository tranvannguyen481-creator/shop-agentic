import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  qty: z.number().int().min(1, "qty must be at least 1"),
  selectedOptionIds: z.array(z.string()).optional().default([]),
});

export const calculateOrderSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  items: z.array(orderItemSchema).min(1, "items cannot be empty"),
  isGroupBuy: z.boolean().default(false),
});

export const placeOrderSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  items: z.array(orderItemSchema).min(1, "items cannot be empty"),
  isGroupBuy: z.boolean().default(false),
  paymentMethod: z.enum(["momo", "vnpay", "zalopay", "cod"]).default("cod"),
  deliveryAddress: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

export const orderIdParamsSchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  eventId: z.string().optional(),
  status: z.string().optional(),
});

export type CalculateOrderBody = z.infer<typeof calculateOrderSchema>;
export type PlaceOrderBody = z.infer<typeof placeOrderSchema>;
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
