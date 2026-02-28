import admin from "@/app/config/firebaseAdmin";
import {
  EVENTS_COLLECTION,
  USER_HOSTED_EVENTS_COLLECTION,
} from "@/features/event/constants/event.constants";
import type { CreateEventBody } from "@/features/event/dtos/event.dto";
import {
  EVENT_STATUS,
  type EventListItem,
  type EventStatus,
  type GroupEventListItem,
} from "@/features/event/types/event.types";
import { AppError } from "@/shared/exceptions/AppError";
import { assertActor } from "@/shared/utils/assert-actor";
import { normalizeEmail, toNumber } from "@/shared/utils/firestore.utils";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getGroupForCreate, resolveGroupId } from "./event-helpers";
import {
  mapEventListItem,
  mapEventPayload,
  mapEventProductItem,
  mapGroupEventListItem,
} from "./event-mappers";

const db = admin.firestore();

// ─── Service Functions ───────────────────────────────────────────────────────

export async function createEvent(
  data: CreateEventBody,
  actor: DecodedIdToken,
): Promise<{ eventId: string; groupId: string }> {
  assertActor(actor);

  const rawData = data as unknown as Record<string, unknown>;
  const groupId = resolveGroupId(rawData);

  if (!groupId)
    throw AppError.badRequest("groupId is required when creating event");

  const group = await getGroupForCreate(groupId, actor);
  const eventRef = db.collection(EVENTS_COLLECTION).doc();
  const payload: Record<string, unknown> = {
    ...mapEventPayload(rawData, actor),
    groupId,
    groupName: typeof group["name"] === "string" ? group["name"] : "",
  };

  const hostedEventRef = db
    .collection(USER_HOSTED_EVENTS_COLLECTION)
    .doc(`${actor.uid}_${eventRef.id}`);

  const hostedEventPayload = {
    eventId: eventRef.id,
    hostUid: actor.uid,
    userId: actor.uid,
    groupId,
    status: payload["status"],
    buyCount: toNumber(payload["buyCount"], 0),
    totalPurchase: String(payload["totalPurchase"] ?? "$0.00"),
    yearMonth: payload["yearMonth"],
    title: payload["title"],
    closingDate: payload["closingDate"],
    createdAt: payload["createdAt"],
    updatedAt: payload["updatedAt"],
  };

  const batch = db.batch();
  batch.set(eventRef, payload);
  batch.set(hostedEventRef, hostedEventPayload);
  await batch.commit();

  return { eventId: eventRef.id, groupId };
}

export async function listEvents({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<{ items: EventListItem[]; total: number }> {
  const normalizedPage = Math.max(1, toNumber(page, 1));
  const normalizedPageSize = Math.max(1, toNumber(pageSize, 20));

  const snapshot = await db
    .collection(EVENTS_COLLECTION)
    .orderBy("updatedAt", "desc")
    .limit(200)
    .get();

  const allItems = snapshot.docs.map((doc) =>
    mapEventListItem(doc.id, (doc.data() ?? {}) as Record<string, unknown>),
  );

  const start = (normalizedPage - 1) * normalizedPageSize;
  return {
    items: allItems.slice(start, start + normalizedPageSize),
    total: allItems.length,
  };
}

export async function listHostedEvents(
  actor: DecodedIdToken | null,
  { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {},
): Promise<{ items: EventListItem[]; total: number }> {
  const hostUid = actor?.uid ?? "";
  const hostEmail =
    typeof actor?.email === "string" ? actor.email.toLowerCase() : "";

  if (!hostUid && !hostEmail) return { items: [], total: 0 };

  const normalizedPage = Math.max(1, toNumber(page, 1));
  const normalizedPageSize = Math.max(1, toNumber(pageSize, 20));

  const queryTasks = [];

  if (hostUid) {
    queryTasks.push(
      db
        .collection(EVENTS_COLLECTION)
        .where("hostUid", "==", hostUid)
        .limit(200)
        .get(),
      db
        .collection(EVENTS_COLLECTION)
        .where("userId", "==", hostUid)
        .limit(200)
        .get(),
    );
  }

  if (hostEmail) {
    queryTasks.push(
      db
        .collection(EVENTS_COLLECTION)
        .where("hostEmail", "==", hostEmail)
        .limit(200)
        .get(),
    );
  }

  const snapshots = await Promise.all(queryTasks);
  const mergedById = new Map<string, EventListItem>();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      mergedById.set(
        doc.id,
        mapEventListItem(doc.id, (doc.data() ?? {}) as Record<string, unknown>),
      );
    });
  });

  if (mergedById.size === 0 && process.env.NODE_ENV !== "production") {
    const fallbackSnapshot = await db
      .collection(EVENTS_COLLECTION)
      .orderBy("updatedAt", "desc")
      .limit(200)
      .get();

    fallbackSnapshot.docs.forEach((doc) => {
      const source = (doc.data() ?? {}) as Record<string, unknown>;
      const sourceEmail =
        typeof source["hostEmail"] === "string"
          ? source["hostEmail"].toLowerCase()
          : "";

      if (
        hostUid &&
        (source["hostUid"] === hostUid || source["userId"] === hostUid)
      ) {
        mergedById.set(doc.id, mapEventListItem(doc.id, source));
        return;
      }

      if (hostEmail && sourceEmail === hostEmail) {
        mergedById.set(doc.id, mapEventListItem(doc.id, source));
      }
    });
  }

  const allItems = Array.from(mergedById.values()).sort(
    (l, r) => toNumber(r.updatedAt, 0) - toNumber(l.updatedAt, 0),
  );

  const start = (normalizedPage - 1) * normalizedPageSize;
  return {
    items: allItems.slice(start, start + normalizedPageSize),
    total: allItems.length,
  };
}

export async function listGroupEvents(
  actor: DecodedIdToken,
  {
    page = 1,
    pageSize = 20,
    search = "",
  }: { page?: number; pageSize?: number; search?: string } = {},
): Promise<{ items: GroupEventListItem[]; total: number }> {
  assertActor(actor);

  const GROUPS_COLLECTION = "groups";
  const actorUid = actor.uid;
  const actorEmail = normalizeEmail(actor.email ?? "");
  const normalizedPage = Math.max(1, toNumber(page, 1));
  const normalizedPageSize = Math.max(1, Math.min(toNumber(pageSize, 20), 100));
  const normalizedSearch =
    typeof search === "string" ? search.trim().toLowerCase() : "";

  const groupQueryTasks = [
    db
      .collection(GROUPS_COLLECTION)
      .where("ownerUid", "==", actorUid)
      .limit(200)
      .get(),
  ];

  if (actorEmail) {
    groupQueryTasks.push(
      db
        .collection(GROUPS_COLLECTION)
        .where("memberEmails", "array-contains", actorEmail)
        .limit(200)
        .get(),
    );
  }

  const groupSnapshots = await Promise.all(groupQueryTasks);
  const groupIds = new Set<string>();

  groupSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => groupIds.add(doc.id));
  });

  if (groupIds.size === 0) return { items: [], total: 0 };

  const groupIdArray = Array.from(groupIds);
  const CHUNK_SIZE = 30;
  const chunks: string[][] = [];
  for (let i = 0; i < groupIdArray.length; i += CHUNK_SIZE) {
    chunks.push(groupIdArray.slice(i, i + CHUNK_SIZE));
  }

  const eventQueryTasks = chunks.map((chunk) =>
    db
      .collection(EVENTS_COLLECTION)
      .where("groupId", "in", chunk)
      .limit(200)
      .get(),
  );

  const eventSnapshots = await Promise.all(eventQueryTasks);
  const mergedById = new Map<string, GroupEventListItem>();

  eventSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      mergedById.set(
        doc.id,
        mapGroupEventListItem(
          doc.id,
          (doc.data() ?? {}) as Record<string, unknown>,
        ),
      );
    });
  });

  let allItems = Array.from(mergedById.values()).sort(
    (a, b) => toNumber(b.updatedAt, 0) - toNumber(a.updatedAt, 0),
  );

  // Auto-close events whose closingDate has passed
  const now = Date.now();
  const toAutoClose = allItems.filter((item) => {
    if (item.status === EVENT_STATUS.CLOSED) return false;
    if (!item.closingDate) return false;
    const t = new Date(item.closingDate).getTime();
    return Number.isFinite(t) && t < now;
  });

  if (toAutoClose.length > 0) {
    const batch = db.batch();
    toAutoClose.forEach(({ id }) => {
      batch.update(db.collection(EVENTS_COLLECTION).doc(id), {
        status: EVENT_STATUS.CLOSED,
        updatedAt: now,
      });
    });
    await batch.commit();
    const closedIds = new Set(toAutoClose.map((i) => i.id));
    allItems = allItems.map((item) =>
      closedIds.has(item.id) ? { ...item, status: EVENT_STATUS.CLOSED } : item,
    );
  }

  if (normalizedSearch) {
    allItems = allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.groupName.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch),
    );
  }

  const start = (normalizedPage - 1) * normalizedPageSize;
  return {
    items: allItems.slice(start, start + normalizedPageSize),
    total: allItems.length,
  };
}

export async function joinEvent(
  eventId: string,
  user: { uid: string },
): Promise<void> {
  const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
  const participantRef = eventRef.collection("participants").doc(user.uid);

  await db.runTransaction(async (transaction) => {
    const event = await transaction.get(eventRef);

    if (!event.exists) throw AppError.notFound("Event not found");

    if ((event.data() ?? {})["status"] !== EVENT_STATUS.ACTIVE) {
      throw AppError.badRequest("Event ended");
    }

    transaction.set(participantRef, { ...user, joinedAt: Date.now() });
    transaction.update(eventRef, {
      currentCount: admin.firestore.FieldValue.increment(1),
      buyCount: admin.firestore.FieldValue.increment(1),
      updatedAt: Date.now(),
    });
  });
}

export async function getEventEditDraft(
  eventId: string,
): Promise<Record<string, unknown>> {
  const eventSnapshot = await db
    .collection(EVENTS_COLLECTION)
    .doc(eventId)
    .get();

  if (!eventSnapshot.exists) throw AppError.notFound("Event not found");

  const eventData = (eventSnapshot.data() ?? {}) as Record<string, unknown>;

  return {
    createEventDraft: {
      groupId: eventData["groupId"] ?? "",
      mode: eventData["mode"] ?? "group-buy",
      title: eventData["title"] ?? "",
      description: eventData["description"] ?? "",
      pickupLocation: eventData["pickupLocation"] ?? "",
      closingDate: eventData["closingDate"] ?? "",
      collectionDate: eventData["collectionDate"] ?? "",
      collectionTime: eventData["collectionTime"] ?? "",
      paymentAfterClosing: Boolean(eventData["paymentAfterClosing"]),
      payTogether: Boolean(eventData["payTogether"]),
      adminFee: String(eventData["adminFee"] ?? "0"),
      addImportantNotes: Boolean(eventData["addImportantNotes"]),
      importantNotes: Array.isArray(eventData["importantNotes"])
        ? eventData["importantNotes"]
        : [],
      addExternalUrl: Boolean(eventData["addExternalUrl"]),
      externalUrlFieldName: eventData["externalUrlFieldName"] ?? "",
      externalUrl: eventData["externalUrl"] ?? "",
      addDeliveryOptions: Boolean(eventData["addDeliveryOptions"]),
      deliveryScheduleDate: eventData["deliveryScheduleDate"] ?? "",
      deliveryTimeFrom: eventData["deliveryTimeFrom"] ?? "",
      deliveryTimeTo: eventData["deliveryTimeTo"] ?? "",
      deliveryFees: Array.isArray(eventData["deliveryFees"])
        ? eventData["deliveryFees"]
        : [],
      requestDeliveryDetails: Boolean(eventData["requestDeliveryDetails"]),
    },
    createItemsDraft: {
      items: Array.isArray(eventData["items"]) ? eventData["items"] : [],
      bannerPreviewUrls: Array.isArray(eventData["bannerPreviewUrls"])
        ? eventData["bannerPreviewUrls"]
        : [],
    },
  };
}

export async function getManageOrdersData(
  eventId: string,
): Promise<Record<string, unknown>> {
  const eventSnapshot = await db
    .collection(EVENTS_COLLECTION)
    .doc(eventId)
    .get();

  if (!eventSnapshot.exists) throw AppError.notFound("Event not found");

  const eventData = (eventSnapshot.data() ?? {}) as Record<string, unknown>;

  return {
    title: eventData["title"] ?? "",
    closingDate: eventData["closingDate"] ?? "",
    collectionDate: eventData["collectionDate"] ?? "",
    closingInText: eventData["closingInText"] ?? "closing in 2 hours",
    deliveryInText: eventData["deliveryInText"] ?? "Delivery in 6 days",
    buyCount: toNumber(eventData["buyCount"], 0),
    totalPurchase: eventData["totalPurchase"] ?? "$0.00",
    adminFee: eventData["adminFee"] ?? "$0.00",
  };
}

export async function getEventDetail(
  eventId: string,
  actor: DecodedIdToken | null,
): Promise<Record<string, unknown>> {
  const eventSnapshot = await db
    .collection(EVENTS_COLLECTION)
    .doc(eventId)
    .get();

  if (!eventSnapshot.exists) throw AppError.notFound("Event not found");

  const eventData = (eventSnapshot.data() ?? {}) as Record<string, unknown>;

  // Permission check: if event belongs to a group, actor must be a member
  if (actor?.uid && eventData["groupId"]) {
    try {
      await getGroupForCreate(eventData["groupId"] as string, actor);
    } catch {
      throw new AppError(
        "You do not have permission to view this event",
        403,
        "FORBIDDEN",
      );
    }
  }

  // Auto-close if closingDate has passed
  const nowMs = Date.now();
  let resolvedStatus =
    (eventData["status"] as EventStatus) ?? EVENT_STATUS.ACTIVE;
  if (resolvedStatus !== EVENT_STATUS.CLOSED && eventData["closingDate"]) {
    const closingMs = new Date(eventData["closingDate"] as string).getTime();
    if (Number.isFinite(closingMs) && closingMs < nowMs) {
      resolvedStatus = EVENT_STATUS.CLOSED;
      await db
        .collection(EVENTS_COLLECTION)
        .doc(eventId)
        .update({ status: EVENT_STATUS.CLOSED, updatedAt: nowMs });
    }
  }

  const rawItems = Array.isArray(eventData["items"])
    ? (eventData["items"] as Record<string, unknown>[])
    : [];

  return {
    id: eventSnapshot.id,
    title: eventData["title"] ?? "",
    description: eventData["description"] ?? "",
    closingDate: eventData["closingDate"] ?? "",
    closingInText: eventData["closingInText"] ?? "Closing soon",
    collectionDate: eventData["collectionDate"] ?? "",
    collectionTime: eventData["collectionTime"] ?? "",
    pickupLocation: eventData["pickupLocation"] ?? "",
    importantNotes: Array.isArray(eventData["importantNotes"])
      ? eventData["importantNotes"]
      : [],
    bannerPreviewUrl:
      Array.isArray(eventData["bannerPreviewUrls"]) &&
      eventData["bannerPreviewUrls"][0]
        ? eventData["bannerPreviewUrls"][0]
        : "",
    hostDisplayName: eventData["hostDisplayName"] ?? "",
    buyCount: toNumber(eventData["buyCount"], 0),
    currentCount: toNumber(eventData["currentCount"], 0),
    adminFee: eventData["adminFee"] ?? "$0.00",
    status: resolvedStatus,
    groupId: eventData["groupId"] ?? "",
    groupName: eventData["groupName"] ?? "",
    vatRate: toNumber(eventData["vatRate"], 0.1),
    discountRules: eventData["discountRules"] ?? {
      groupBuy: { enabled: false, minMembers: 0, extraDiscountPercent: 0 },
    },
    productGroupQty: eventData["productGroupQty"] ?? {},
    products: rawItems.map((item, index) =>
      mapEventProductItem(
        item,
        index,
        (eventData["productGroupQty"] as Record<string, unknown>) ?? {},
      ),
    ),
  };
}

export async function reHostEvent(
  sourceEventId: string,
  actor: DecodedIdToken,
): Promise<{ eventId: string; groupId: string }> {
  assertActor(actor);

  const sourceSnap = await db
    .collection(EVENTS_COLLECTION)
    .doc(sourceEventId)
    .get();

  if (!sourceSnap.exists) throw AppError.notFound("Source event not found");

  const source = (sourceSnap.data() ?? {}) as Record<string, unknown>;

  if (source["groupId"]) {
    await getGroupForCreate(source["groupId"] as string, actor);
  }

  const now = Date.now();
  const newEventRef = db.collection(EVENTS_COLLECTION).doc();

  const payload: Record<string, unknown> = {
    title: source["title"] ?? "",
    description: source["description"] ?? "",
    mode: source["mode"] ?? "group-buy",
    pickupLocation: source["pickupLocation"] ?? "",
    paymentAfterClosing: Boolean(source["paymentAfterClosing"]),
    payTogether: Boolean(source["payTogether"]),
    adminFee: source["adminFee"] ?? "0",
    addImportantNotes: Boolean(source["addImportantNotes"]),
    importantNotes: Array.isArray(source["importantNotes"])
      ? source["importantNotes"]
      : [],
    addExternalUrl: Boolean(source["addExternalUrl"]),
    externalUrlFieldName: source["externalUrlFieldName"] ?? "",
    externalUrl: source["externalUrl"] ?? "",
    addDeliveryOptions: Boolean(source["addDeliveryOptions"]),
    deliveryFees: Array.isArray(source["deliveryFees"])
      ? source["deliveryFees"]
      : [],
    requestDeliveryDetails: Boolean(source["requestDeliveryDetails"]),
    items: (Array.isArray(source["items"]) ? source["items"] : []).map(
      (item: unknown) => {
        const i = item as Record<string, unknown>;
        return {
          ...i,
          id:
            typeof i["id"] === "string" && i["id"].trim()
              ? i["id"].trim()
              : db.collection("_").doc().id,
        };
      },
    ),
    bannerPreviewUrls: Array.isArray(source["bannerPreviewUrls"])
      ? source["bannerPreviewUrls"]
      : [],
    groupId: source["groupId"] ?? "",
    groupName: source["groupName"] ?? "",
    closingDate: "",
    collectionDate: "",
    collectionTime: "",
    deliveryScheduleDate: "",
    deliveryTimeFrom: "",
    deliveryTimeTo: "",
    currentCount: 0,
    buyCount: 0,
    totalPurchase: "$0.00",
    yearMonth: "",
    status: EVENT_STATUS.ACTIVE,
    sourceEventId,
    hostUid: actor.uid,
    userId: actor.uid,
    hostEmail: actor.email ?? source["hostEmail"] ?? "",
    hostDisplayName:
      (actor as Record<string, unknown>)["name"] ??
      (actor as Record<string, unknown>)["displayName"] ??
      source["hostDisplayName"] ??
      "",
    createdAt: now,
    updatedAt: now,
  };

  const groupId = String(payload["groupId"] ?? "");

  const hostedEventRef = db
    .collection(USER_HOSTED_EVENTS_COLLECTION)
    .doc(`${actor.uid}_${newEventRef.id}`);

  const hostedEventPayload = {
    eventId: newEventRef.id,
    hostUid: actor.uid,
    userId: actor.uid,
    groupId,
    status: payload["status"],
    buyCount: 0,
    totalPurchase: "$0.00",
    yearMonth: "",
    title: payload["title"],
    closingDate: "",
    sourceEventId,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(newEventRef, payload);
  batch.set(hostedEventRef, hostedEventPayload);
  await batch.commit();

  return { eventId: newEventRef.id, groupId };
}
