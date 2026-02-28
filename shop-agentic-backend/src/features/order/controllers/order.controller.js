const {
  calculateOrderSchema,
  placeOrderSchema,
  orderIdParamsSchema,
  listOrdersQuerySchema,
} = require("../dtos/order.dto");
const orderService = require("../services/order.service");

async function calculateOrder(req, res) {
  const actor = req.user;
  const body = calculateOrderSchema.parse(req.body || {});

  const result = await orderService.calculateOrder(actor, body);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Tính tiền thành công",
  });
}

async function placeOrder(req, res) {
  const actor = req.user;
  const body = placeOrderSchema.parse(req.body || {});

  const result = await orderService.placeOrder(actor, body);

  return res.status(201).json({
    success: true,
    data: result,
    message: "Đặt hàng thành công",
  });
}

async function getOrderDetail(req, res) {
  const actor = req.user;
  const { orderId } = orderIdParamsSchema.parse(req.params || {});

  const result = await orderService.getOrderDetail(actor, orderId);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function listMyOrders(req, res) {
  const actor = req.user;
  const { page, pageSize, eventId, status } = listOrdersQuerySchema.parse(
    req.query || {},
  );

  const result = await orderService.listMyOrders(actor, {
    page,
    pageSize,
    eventId,
    status,
  });

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function listEventOrders(req, res) {
  const actor = req.user;
  const { eventId } = req.params;

  if (!eventId) {
    const err = new Error("eventId is required");
    err.statusCode = 400;
    throw err;
  }

  const result = await orderService.listEventOrders(actor, eventId);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

module.exports = {
  calculateOrder,
  placeOrder,
  getOrderDetail,
  listMyOrders,
  listEventOrders,
};
