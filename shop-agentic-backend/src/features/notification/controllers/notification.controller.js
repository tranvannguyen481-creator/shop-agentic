const {
  createNotificationBodySchema,
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} = require("../dtos/notification.dto");
const notificationService = require("../services/notification.service");

async function listMyNotifications(req, res) {
  const { page, pageSize, unreadOnly } = listNotificationsQuerySchema.parse(
    req.query || {},
  );
  const result = await notificationService.listMyNotifications(req.user, {
    page,
    pageSize,
    unreadOnly,
  });

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function createNotification(req, res) {
  const payload = createNotificationBodySchema.parse(req.body || {});
  const result = await notificationService.createNotification(
    payload,
    req.user,
  );

  return res.status(201).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function markAsRead(req, res) {
  const { notificationId } = notificationIdParamsSchema.parse(req.params || {});
  const result = await notificationService.markNotificationAsRead(
    notificationId,
    req.user,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function markAllAsRead(req, res) {
  const result = await notificationService.markAllNotificationsAsRead(req.user);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

module.exports = {
  listMyNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
};
