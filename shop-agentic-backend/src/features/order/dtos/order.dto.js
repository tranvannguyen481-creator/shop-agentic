const { z } = require("zod");

// Schema cho 1 item trong order
const orderItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  qty: z.number().int().min(1, "qty must be at least 1"),
  // selectedOptions dùng cho sản phẩm có nhiều biến thể
  selectedOptionIds: z.array(z.string()).optional().default([]),
});

// Schema cho tính toán đơn hàng (preview trước khi đặt)
const calculateOrderSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  items: z.array(orderItemSchema).min(1, "items cannot be empty"),
  isGroupBuy: z.boolean().default(false),
});

// Schema cho đặt đơn hàng (thực sự lưu vào DB)
const placeOrderSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  items: z.array(orderItemSchema).min(1, "items cannot be empty"),
  isGroupBuy: z.boolean().default(false),
  paymentMethod: z.enum(["momo", "vnpay", "zalopay", "cod"]).default("cod"),
  deliveryAddress: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

// Schema cho params
const orderIdParamsSchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
});

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  eventId: z.string().optional(),
  status: z.string().optional(),
});

module.exports = {
  calculateOrderSchema,
  placeOrderSchema,
  orderIdParamsSchema,
  listOrdersQuerySchema,
};
