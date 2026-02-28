import type {
  NotificationItem,
  NotificationPriority,
  NotificationType,
} from "@/features/notification/types/notification.types";
import { toNumber } from "@/shared/utils/firestore.utils";

export interface NotificationSource {
  userId?: string;
  type?: NotificationType;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  isRead?: boolean;
  readAt?: number | null;
  priority?: NotificationPriority;
  createdAt?: number;
  relatedEventId?: string;
  relatedOrderId?: string;
}

export interface UserNotificationSource {
  userId?: string;
  notificationId?: string;
  isRead?: boolean;
  readAt?: number | null;
  createdAt?: number;
}

export const toNotificationItem = (
  id: string,
  source: NotificationSource,
  userView: UserNotificationSource,
): NotificationItem => ({
  id,
  userId: source.userId ?? userView.userId ?? "",
  type: source.type ?? ("broadcast" as NotificationType),
  title: source.title ?? "",
  body: source.body ?? "",
  data:
    source.data &&
    typeof source.data === "object" &&
    !Array.isArray(source.data)
      ? source.data
      : {},
  isRead: Boolean(userView.isRead ?? source.isRead),
  readAt: userView.readAt ?? source.readAt ?? null,
  priority: source.priority ?? ("normal" as NotificationPriority),
  createdAt: toNumber(userView.createdAt ?? source.createdAt, 0),
  relatedEventId:
    source.relatedEventId ??
    (source.data && typeof source.data["eventId"] === "string"
      ? source.data["eventId"]
      : ""),
  relatedOrderId:
    source.relatedOrderId ??
    (source.data && typeof source.data["orderId"] === "string"
      ? source.data["orderId"]
      : ""),
});
