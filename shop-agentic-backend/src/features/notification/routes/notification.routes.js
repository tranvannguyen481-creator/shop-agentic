const express = require("express");
const authMiddleware = require("../../../shared/middleware/auth");
const notificationController = require("../controllers/notification.controller");

const router = express.Router();

router.use(authMiddleware);
router.get("/my", notificationController.listMyNotifications);
router.post("/", notificationController.createNotification);
router.patch("/:notificationId/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

module.exports = router;
