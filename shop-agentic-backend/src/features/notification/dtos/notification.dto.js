const { z } = require("zod");
const {
  NOTIFICATION_PRIORITY,
  NOTIFICATION_TYPE,
} = require("../types/notification.types");

const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

const notificationIdParamsSchema = z.object({
  notificationId: z.string().trim().min(1, "notificationId is required"),
});

const createNotificationBodySchema = z.object({
  userId: z.string().trim().min(1, "userId is required"),
  type: z.enum([
    NOTIFICATION_TYPE.ORDER_NEW,
    NOTIFICATION_TYPE.EVENT_CLOSING_SOON,
    NOTIFICATION_TYPE.PAYMENT_SUCCESS,
    NOTIFICATION_TYPE.BROADCAST,
    NOTIFICATION_TYPE.EVENT_CLOSED,
    NOTIFICATION_TYPE.GROUP_INVITE,
  ]),
  title: z.string().trim().min(1, "title is required").max(140),
  body: z.string().trim().min(1, "body is required").max(500),
  data: z.record(z.string(), z.unknown()).optional().default({}),
  priority: z
    .enum([NOTIFICATION_PRIORITY.HIGH, NOTIFICATION_PRIORITY.NORMAL])
    .optional()
    .default(NOTIFICATION_PRIORITY.NORMAL),
});

module.exports = {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
  createNotificationBodySchema,
};
