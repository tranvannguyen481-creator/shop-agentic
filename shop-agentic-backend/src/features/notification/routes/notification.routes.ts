import * as notificationController from "@/features/notification/controllers/notification.controller";
import authMiddleware from "@/shared/middleware/auth";
import { Router } from "express";

const router = Router();

router.use(authMiddleware);
router.get("/my", notificationController.listMyNotifications);
router.post("/", notificationController.createNotification);
router.patch("/:notificationId/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

export default router;
