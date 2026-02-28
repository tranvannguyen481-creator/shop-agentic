export const NOTIFICATION_TYPE = {
  ORDER_NEW: "order_new",
  EVENT_CLOSING_SOON: "event_closing_soon",
  PAYMENT_SUCCESS: "payment_success",
  BROADCAST: "broadcast",
  EVENT_CLOSED: "event_closed",
  GROUP_INVITE: "group_invite",
} as const;

export const NOTIFICATION_PRIORITY = {
  HIGH: "high",
  NORMAL: "normal",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
export type NotificationPriority =
  (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY];

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: number | null;
  priority: NotificationPriority;
  createdAt: number;
  relatedEventId: string;
  relatedOrderId: string;
}
