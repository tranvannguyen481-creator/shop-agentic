import admin from "@/app/config/firebaseAdmin";
import {
  NOTIFICATIONS_COLLECTION,
  USER_NOTIFICATIONS_COLLECTION,
} from "@/features/notification/constants/notification.constants";
import type { CreateNotificationBody } from "@/features/notification/dtos/notification.dto";
import type {
  NotificationItem,
  NotificationPriority,
  NotificationType,
} from "@/features/notification/types/notification.types";
import { AppError } from "@/shared/exceptions/AppError";
import type { DecodedIdToken } from "firebase-admin/auth";

const db = admin.firestore();

// ─── Helpers ────────────────────────────────────────────────────────────────

function assertActor(
  actor: DecodedIdToken | undefined,
): asserts actor is DecodedIdToken {
  if (!actor?.uid) throw AppError.unauthorized();
}

const toNumber = (value: unknown, fallback = 0): number => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

interface NotificationSource {
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

interface UserNotificationSource {
  userId?: string;
  notificationId?: string;
  isRead?: boolean;
  readAt?: number | null;
  createdAt?: number;
}

const toNotificationItem = (
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

// ─── Service Functions ───────────────────────────────────────────────────────

export async function createNotification(
  payload: CreateNotificationBody,
  actor: DecodedIdToken,
): Promise<NotificationItem> {
  assertActor(actor);

  if (actor.uid !== payload.userId) {
    throw new AppError(
      "You can only create notification for yourself",
      403,
      "FORBIDDEN",
    );
  }

  const now = Date.now();
  const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
  const userNotificationRef = db
    .collection(USER_NOTIFICATIONS_COLLECTION)
    .doc(`${payload.userId}_${notificationRef.id}`);

  const dataPayload =
    payload.data && typeof payload.data === "object" ? payload.data : {};

  const nextNotification: NotificationSource & {
    updatedAt: number;
    notificationId?: undefined;
  } = {
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: dataPayload,
    relatedEventId:
      typeof dataPayload["eventId"] === "string" ? dataPayload["eventId"] : "",
    relatedOrderId:
      typeof dataPayload["orderId"] === "string" ? dataPayload["orderId"] : "",
    isRead: false,
    readAt: null,
    priority: payload.priority,
    createdAt: now,
    updatedAt: now,
  };

  const nextUserNotification: UserNotificationSource & { updatedAt: number } = {
    userId: payload.userId,
    notificationId: notificationRef.id,
    isRead: false,
    readAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(notificationRef, nextNotification);
  batch.set(userNotificationRef, nextUserNotification);
  await batch.commit();

  return toNotificationItem(
    notificationRef.id,
    nextNotification,
    nextUserNotification,
  );
}

export async function listMyNotifications(
  actor: DecodedIdToken,
  {
    page = 1,
    pageSize = 20,
    unreadOnly = false,
  }: { page?: number; pageSize?: number; unreadOnly?: boolean } = {},
): Promise<{ items: NotificationItem[]; total: number }> {
  assertActor(actor);

  const normalizedPage = Math.max(1, toNumber(page, 1));
  const normalizedPageSize = Math.max(1, toNumber(pageSize, 20));

  let query = db
    .collection(USER_NOTIFICATIONS_COLLECTION)
    .where("userId", "==", actor.uid)
    .orderBy("createdAt", "desc")
    .limit(400) as FirebaseFirestore.Query;

  if (unreadOnly) {
    query = query.where("isRead", "==", false);
  }

  const userNotificationSnapshot = await query.get();
  const allUserItems = userNotificationSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as UserNotificationSource),
  }));

  const start = (normalizedPage - 1) * normalizedPageSize;
  const pagedUserItems = allUserItems.slice(start, start + normalizedPageSize);

  const notificationRefs = pagedUserItems
    .map((item) => {
      const notificationId = item.notificationId;
      if (!notificationId || typeof notificationId !== "string") return null;
      return db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
    })
    .filter((ref): ref is FirebaseFirestore.DocumentReference => ref !== null);

  const notificationSnapshots =
    notificationRefs.length > 0 ? await db.getAll(...notificationRefs) : [];

  const byNotificationId = new Map<string, NotificationSource>();
  notificationSnapshots.forEach((snapshot) => {
    if (snapshot.exists) {
      byNotificationId.set(snapshot.id, snapshot.data() as NotificationSource);
    }
  });

  const items = pagedUserItems
    .map((userItem) => {
      const notificationId = userItem.notificationId;
      if (!notificationId || typeof notificationId !== "string") return null;
      const source = byNotificationId.get(notificationId) ?? {};
      return toNotificationItem(notificationId, source, userItem);
    })
    .filter((item): item is NotificationItem => item !== null);

  return { items, total: allUserItems.length };
}

export async function markNotificationAsRead(
  notificationId: string,
  actor: DecodedIdToken,
): Promise<NotificationItem> {
  assertActor(actor);

  const userNotificationId = `${actor.uid}_${notificationId}`;
  const notificationRef = db
    .collection(NOTIFICATIONS_COLLECTION)
    .doc(notificationId);
  const userNotificationRef = db
    .collection(USER_NOTIFICATIONS_COLLECTION)
    .doc(userNotificationId);

  const [notificationSnapshot, userNotificationSnapshot] = await Promise.all([
    notificationRef.get(),
    userNotificationRef.get(),
  ]);

  if (!notificationSnapshot.exists || !userNotificationSnapshot.exists) {
    throw AppError.notFound("Notification not found");
  }

  const notificationData = notificationSnapshot.data() as NotificationSource;
  if (notificationData.userId !== actor.uid) {
    throw AppError.forbidden();
  }

  const now = Date.now();
  const patch = { isRead: true, readAt: now, updatedAt: now };

  const batch = db.batch();
  batch.set(notificationRef, patch, { merge: true });
  batch.set(userNotificationRef, patch, { merge: true });
  await batch.commit();

  return toNotificationItem(
    notificationId,
    { ...notificationData, ...patch },
    {
      ...(userNotificationSnapshot.data() as UserNotificationSource),
      ...patch,
    },
  );
}

export async function markAllNotificationsAsRead(
  actor: DecodedIdToken,
): Promise<{ updatedCount: number }> {
  assertActor(actor);

  const unreadSnapshot = await db
    .collection(USER_NOTIFICATIONS_COLLECTION)
    .where("userId", "==", actor.uid)
    .where("isRead", "==", false)
    .limit(300)
    .get();

  if (unreadSnapshot.empty) return { updatedCount: 0 };

  const now = Date.now();
  const patch = { isRead: true, readAt: now, updatedAt: now };

  const batch = db.batch();
  let updatedCount = 0;

  unreadSnapshot.docs.forEach((doc) => {
    const userNotification = doc.data() as UserNotificationSource;
    const notificationId = userNotification.notificationId;

    batch.set(doc.ref, patch, { merge: true });

    if (notificationId && typeof notificationId === "string") {
      const notificationRef = db
        .collection(NOTIFICATIONS_COLLECTION)
        .doc(notificationId);
      batch.set(notificationRef, patch, { merge: true });
    }

    updatedCount += 1;
  });

  await batch.commit();
  return { updatedCount };
}
