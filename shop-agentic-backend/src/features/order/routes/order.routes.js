const express = require("express");
const authMiddleware = require("../../../shared/middleware/auth");
const orderController = require("../controllers/order.controller");

const router = express.Router();

// Tất cả order routes đều yêu cầu đăng nhập
router.use(authMiddleware);

// POST /api/orders/calculate  — tính toán giá (không lưu DB)
router.post("/calculate", orderController.calculateOrder);

// POST /api/orders            — đặt hàng (lưu vào DB)
router.post("/", orderController.placeOrder);

// GET  /api/orders            — danh sách đơn hàng của user hiện tại
router.get("/", orderController.listMyOrders);

// GET  /api/orders/event/:eventId — host xem tất cả đơn của event
router.get("/event/:eventId", orderController.listEventOrders);

// GET  /api/orders/:orderId   — chi tiết 1 đơn hàng
router.get("/:orderId", orderController.getOrderDetail);

module.exports = router;
