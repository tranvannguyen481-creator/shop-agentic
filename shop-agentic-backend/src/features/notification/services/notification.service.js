const admin = require("../../../config/firebaseAdmin");
const {
  NOTIFICATIONS_COLLECTION,
  USER_NOTIFICATIONS_COLLECTION,
} = require("../constants/notification.constants");

const db = admin.firestore();

const assertActor = (actor) => {
  if (!actor?.uid) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
};

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toNotificationItem = (id, source = {}, userView = {}) => ({
  id,
  userId: source.userId || userView.userId || "",
  type: source.type || "broadcast",
  title: source.title || "",
  body: source.body || "",
  data:
    source.data &&
    typeof source.data === "object" &&
    !Array.isArray(source.data)
      ? source.data
      : {},
  isRead: Boolean(userView.isRead ?? source.isRead),
  readAt: userView.readAt ?? source.readAt ?? null,
  priority: source.priority || "normal",
  createdAt: toNumber(userView.createdAt ?? source.createdAt, 0),
  relatedEventId:
    source.relatedEventId ||
    (source.data && typeof source.data.eventId === "string"
      ? source.data.eventId
      : ""),
  relatedOrderId:
    source.relatedOrderId ||
    (source.data && typeof source.data.orderId === "string"
      ? source.data.orderId
      : ""),
});

async function createNotification(payload, actor) {
  assertActor(actor);

  if (actor.uid !== payload.userId) {
    const error = new Error("You can only create notification for yourself");
    error.statusCode = 403;
    throw error;
  }

  const now = Date.now();
  const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
  const userNotificationRef = db
    .collection(USER_NOTIFICATIONS_COLLECTION)
    .doc(`${payload.userId}_${notificationRef.id}`);

  const dataPayload =
    payload.data && typeof payload.data === "object" ? payload.data : {};

  const nextNotification = {
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: dataPayload,
    relatedEventId:
      typeof dataPayload.eventId === "string" ? dataPayload.eventId : "",
    relatedOrderId:
      typeof dataPayload.orderId === "string" ? dataPayload.orderId : "",
    isRead: false,
    readAt: null,
    priority: payload.priority,
    createdAt: now,
    updatedAt: now,
  };

  const nextUserNotification = {
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

async function listMyNotifications(
  actor,
  { page = 1, pageSize = 20, unreadOnly = false } = {},
) {
  assertActor(actor);

  const normalizedPage = Math.max(1, toNumber(page, 1));
  const normalizedPageSize = Math.max(1, toNumber(pageSize, 20));

  let query = db
    .collection(USER_NOTIFICATIONS_COLLECTION)
    .where("userId", "==", actor.uid)
    .orderBy("createdAt", "desc")
    .limit(400);

  if (unreadOnly) {
    query = query.where("isRead", "==", false);
  }

  const userNotificationSnapshot = await query.get();
  const allUserItems = userNotificationSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() || {}),
  }));

  const start = (normalizedPage - 1) * normalizedPageSize;
  const pagedUserItems = allUserItems.slice(start, start + normalizedPageSize);

  const notificationRefs = pagedUserItems
    .map((item) => {
      const notificationId = item.notificationId;
      if (!notificationId || typeof notificationId !== "string") {
        return null;
      }

      return db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
    })
    .filter(Boolean);

  const notificationSnapshots =
    notificationRefs.length > 0 ? await db.getAll(...notificationRefs) : [];

  const byNotificationId = new Map();
  notificationSnapshots.forEach((snapshot) => {
    if (snapshot.exists) {
      byNotificationId.set(snapshot.id, snapshot.data() || {});
    }
  });

  const items = pagedUserItems
    .map((userItem) => {
      const notificationId = userItem.notificationId;
      if (!notificationId || typeof notificationId !== "string") {
        return null;
      }

      const source = byNotificationId.get(notificationId) || {};
      return toNotificationItem(notificationId, source, userItem);
    })
    .filter(Boolean);

  return {
    items,
    total: allUserItems.length,
  };
}

async function markNotificationAsRead(notificationId, actor) {
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
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  const notificationData = notificationSnapshot.data() || {};
  if (notificationData.userId !== actor.uid) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  const now = Date.now();
  const patch = {
    isRead: true,
    readAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(notificationRef, patch, { merge: true });
  batch.set(userNotificationRef, patch, { merge: true });
  await batch.commit();

  const mergedSource = {
    ...notificationData,
    ...patch,
  };
  const mergedUserSource = {
    ...(userNotificationSnapshot.data() || {}),
    ...patch,
  };

  return toNotificationItem(notificationId, mergedSource, mergedUserSource);
}

async function markAllNotificationsAsRead(actor) {
  assertActor(actor);

  const unreadSnapshot = await db
    .collection(USER_NOTIFICATIONS_COLLECTION)
    .where("userId", "==", actor.uid)
    .where("isRead", "==", false)
    .limit(300)
    .get();

  if (unreadSnapshot.empty) {
    return {
      updatedCount: 0,
    };
  }

  const now = Date.now();
  const patch = {
    isRead: true,
    readAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  let updatedCount = 0;

  unreadSnapshot.docs.forEach((doc) => {
    const userNotification = doc.data() || {};
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

  return {
    updatedCount,
  };
}

module.exports = {
  createNotification,
  listMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
