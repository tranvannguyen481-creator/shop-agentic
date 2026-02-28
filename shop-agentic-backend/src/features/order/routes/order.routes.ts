import * as orderController from "@/features/order/controllers/order.controller";
import authMiddleware from "@/shared/middleware/auth";
import { Router } from "express";

const router = Router();

router.use(authMiddleware);

router.post("/calculate", orderController.calculateOrder);
router.post("/", orderController.placeOrder);
router.get("/", orderController.listMyOrders);
router.get("/event/:eventId", orderController.listEventOrders);
router.get("/:orderId", orderController.getOrderDetail);

export default router;
