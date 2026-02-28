import admin from "@/app/config/firebaseAdmin";
import {
  EVENTS_COLLECTION,
  GROUPS_COLLECTION,
  USER_HOSTED_EVENTS_COLLECTION,
} from "@/features/event/constants/event.constants";
import type { CreateEventBody } from "@/features/event/dtos/event.dto";
import {
  EVENT_STATUS,
  type EventListItem,
  type EventProductItem,
  type EventStatus,
  type GroupEventListItem,
} from "@/features/event/types/event.types";
import { AppError } from "@/shared/exceptions/AppError";
import type { DecodedIdToken } from "firebase-admin/auth";

const db = admin.firestore();

// ─── Helpers ────────────────────────────────────────────────────────────────

const toNumber = (value: unknown, fallback = 0): number => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toPriceNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeEmail = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const toYearMonth = (
  closingDate: unknown,
  fallbackTimestamp: number,
): string => {
  const parsedDate = new Date(closingDate as string | number);

  if (Number.isNaN(parsedDate.getTime())) {
    const fallbackDate = new Date(fallbackTimestamp);
    const year = fallbackDate.getUTCFullYear();
    const month = String(fallbackDate.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const resolveGroupId = (data: Record<string, unknown> = {}): string => {
  const createEventDraft = (data["createEventDraft"] ?? data) as Record<
    string,
    unknown
  >;

  const fromDraft =
    typeof createEventDraft["groupId"] === "string"
      ? createEventDraft["groupId"].trim()
      : "";
  const fromRoot =
    typeof data["groupId"] === "string" ? data["groupId"].trim() : "";

  return fromDraft || fromRoot;
};

function assertActor(
  actor: DecodedIdToken | undefined,
): asserts actor is DecodedIdToken {
  if (!actor?.uid) throw AppError.unauthorized();
}

// ─── Group helpers ───────────────────────────────────────────────────────────

async function getGroupForCreate(
  groupId: string,
  actor: DecodedIdToken,
): Promise<Record<string, unknown> & { id: string }> {
  const groupSnapshot = await db
    .collection(GROUPS_COLLECTION)
    .doc(groupId)
    .get();

  if (!groupSnapshot.exists)
    throw AppError.notFound("Selected group not found");

  const group = (groupSnapshot.data() ?? {}) as Record<string, unknown>;
  const actorEmail = normalizeEmail(actor?.email ?? "");
  const memberEmails = Array.isArray(group["memberEmails"])
    ? (group["memberEmails"] as string[])
        .map((email) => normalizeEmail(email))
        .filter(Boolean)
    : [];
  const memberUids = Array.isArray(group["memberUids"])
    ? (group["memberUids"] as string[])
    : [];

  const canCreate =
    group["ownerUid"] === actor.uid ||
    memberUids.includes(actor.uid) ||
    (actorEmail && memberEmails.includes(actorEmail));

  if (!canCreate) {
    throw new AppError(
      "You are not allowed to create event in this group",
      403,
      "FORBIDDEN",
    );
  }

  return { id: groupSnapshot.id, ...group };
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

const mapEventPayload = (
  data: Record<string, unknown>,
  actor: DecodedIdToken | null,
): Record<string, unknown> => {
  const now = Date.now();
  const createEventDraft = (data["createEventDraft"] ?? data) as Record<
    string,
    unknown
  >;
  const createItemsDraft = (data["createItemsDraft"] ?? {}) as Record<
    string,
    unknown
  >;
  const groupId = resolveGroupId(data);

  return {
    title: createEventDraft["title"] ?? "",
    description: createEventDraft["description"] ?? "",
    mode: createEventDraft["mode"] ?? "group-buy",
    pickupLocation: createEventDraft["pickupLocation"] ?? "",
    closingDate: createEventDraft["closingDate"] ?? "",
    collectionDate: createEventDraft["collectionDate"] ?? "",
    collectionTime: createEventDraft["collectionTime"] ?? "",
    paymentAfterClosing: Boolean(createEventDraft["paymentAfterClosing"]),
    payTogether: Boolean(createEventDraft["payTogether"]),
    adminFee: String(createEventDraft["adminFee"] ?? "0"),
    addImportantNotes: Boolean(createEventDraft["addImportantNotes"]),
    importantNotes: Array.isArray(createEventDraft["importantNotes"])
      ? createEventDraft["importantNotes"]
      : [],
    addExternalUrl: Boolean(createEventDraft["addExternalUrl"]),
    externalUrlFieldName: createEventDraft["externalUrlFieldName"] ?? "",
    externalUrl: createEventDraft["externalUrl"] ?? "",
    addDeliveryOptions: Boolean(createEventDraft["addDeliveryOptions"]),
    deliveryScheduleDate: createEventDraft["deliveryScheduleDate"] ?? "",
    deliveryTimeFrom: createEventDraft["deliveryTimeFrom"] ?? "",
    deliveryTimeTo: createEventDraft["deliveryTimeTo"] ?? "",
    deliveryFees: Array.isArray(createEventDraft["deliveryFees"])
      ? createEventDraft["deliveryFees"]
      : [],
    requestDeliveryDetails: Boolean(createEventDraft["requestDeliveryDetails"]),
    groupId,
    yearMonth: toYearMonth(createEventDraft["closingDate"], now),
    items: (Array.isArray(createItemsDraft["items"])
      ? createItemsDraft["items"]
      : []
    ).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      return {
        ...i,
        id:
          typeof i["id"] === "string" && i["id"].trim()
            ? i["id"].trim()
            : db.collection("_").doc().id,
      };
    }),
    bannerPreviewUrls: Array.isArray(createItemsDraft["bannerPreviewUrls"])
      ? createItemsDraft["bannerPreviewUrls"]
      : [],
    currentCount: toNumber(data["currentCount"], 0),
    buyCount: toNumber(data["buyCount"], 0),
    totalPurchase: String(data["totalPurchase"] ?? "$0.00"),
    status: (data["status"] as EventStatus) ?? EVENT_STATUS.ACTIVE,
    userId: actor?.uid ?? data["userId"] ?? "",
    hostUid: actor?.uid ?? data["hostUid"] ?? "",
    hostEmail: actor?.email ?? data["hostEmail"] ?? "",
    hostDisplayName:
      (actor as Record<string, unknown> | null)?.["name"] ??
      (actor as Record<string, unknown> | null)?.["displayName"] ??
      data["hostDisplayName"] ??
      "",
    createdAt: data["createdAt"] ?? now,
    updatedAt: now,
    // VAT 10% theo Luật Thuế GTGT VN 2024 & Thông tư 219/2013
    vatRate: typeof data["vatRate"] === "number" ? data["vatRate"] : 0.1,
    discountRules:
      data["discountRules"] && typeof data["discountRules"] === "object"
        ? {
            groupBuy: {
              enabled: Boolean(
                (data["discountRules"] as Record<string, unknown>)?.["groupBuy"]
                  ? (
                      (data["discountRules"] as Record<string, unknown>)[
                        "groupBuy"
                      ] as Record<string, unknown>
                    )["enabled"]
                  : false,
              ),
              minMembers: toNumber(
                (data["discountRules"] as Record<string, unknown>)?.["groupBuy"]
                  ? (
                      (data["discountRules"] as Record<string, unknown>)[
                        "groupBuy"
                      ] as Record<string, unknown>
                    )["minMembers"]
                  : 0,
                0,
              ),
              extraDiscountPercent: toNumber(
                (data["discountRules"] as Record<string, unknown>)?.["groupBuy"]
                  ? (
                      (data["discountRules"] as Record<string, unknown>)[
                        "groupBuy"
                      ] as Record<string, unknown>
                    )["extraDiscountPercent"]
                  : 0,
                0,
              ),
            },
          }
        : {
            groupBuy: {
              enabled: false,
              minMembers: 0,
              extraDiscountPercent: 0,
            },
          },
    productGroupQty: data["productGroupQty"] ?? {},
  };
};

const mapEventListItem = (
  id: string,
  source: Record<string, unknown>,
): EventListItem => ({
  id,
  title: (source["title"] as string) ?? "",
  description: (source["description"] as string) ?? "",
  closingDate: (source["closingDate"] as string) ?? "",
  collectionDate: (source["collectionDate"] as string) ?? "",
  closingInText: (source["closingInText"] as string) ?? "closing in 2 hours",
  deliveryInText: (source["deliveryInText"] as string) ?? "Delivery in 6 days",
  buyCount: toNumber(source["buyCount"], 0),
  totalPurchase: (source["totalPurchase"] as string) ?? "$0.00",
  adminFee: (source["adminFee"] as string) ?? "$0.00",
  status: (source["status"] as EventStatus) ?? EVENT_STATUS.ACTIVE,
  userId: (source["userId"] as string) ?? "",
  hostUid: (source["hostUid"] as string) ?? "",
  hostDisplayName: (source["hostDisplayName"] as string) ?? "",
  updatedAt: (source["updatedAt"] as number) ?? null,
  bannerPreviewUrls: Array.isArray(source["bannerPreviewUrls"])
    ? (source["bannerPreviewUrls"] as string[])
    : [],
});

const mapGroupEventListItem = (
  id: string,
  source: Record<string, unknown>,
): GroupEventListItem => ({
  id,
  title: (source["title"] as string) ?? "",
  description: (source["description"] as string) ?? "",
  closingDate: (source["closingDate"] as string) ?? "",
  collectionDate: (source["collectionDate"] as string) ?? "",
  closingInText: (source["closingInText"] as string) ?? "closing in 2 hours",
  deliveryInText: (source["deliveryInText"] as string) ?? "Delivery in 6 days",
  buyCount: toNumber(source["buyCount"], 0),
  totalPurchase: (source["totalPurchase"] as string) ?? "$0.00",
  adminFee: (source["adminFee"] as string) ?? "$0.00",
  status: (source["status"] as EventStatus) ?? EVENT_STATUS.ACTIVE,
  groupId: (source["groupId"] as string) ?? "",
  groupName: (source["groupName"] as string) ?? "",
  hostDisplayName: (source["hostDisplayName"] as string) ?? "",
  updatedAt: (source["updatedAt"] as number) ?? null,
});

const mapEventProductItem = (
  item: Record<string, unknown>,
  index: number,
  productGroupQtyMap: Record<string, unknown>,
): EventProductItem => {
  const itemName = typeof item["name"] === "string" ? item["name"].trim() : "";
  const itemDescription =
    typeof item["description"] === "string" ? item["description"].trim() : "";
  const basePrice = toPriceNumber(item["price"]);
  const rawOptions = Array.isArray(item["options"]) ? item["options"] : [];

  const mappedOptionGroups = (rawOptions as unknown[])
    .map((optionGroup: unknown, groupIndex: number) => {
      if (!optionGroup || typeof optionGroup !== "object") {
        if (typeof optionGroup === "string" && optionGroup.trim()) {
          return {
            id: `group-${groupIndex + 1}`,
            name: "Options",
            required: false,
            choices: [
              {
                id: `choice-${groupIndex + 1}-1`,
                name: optionGroup.trim(),
                price: 0,
              },
            ],
          };
        }
        return null;
      }

      const og = optionGroup as Record<string, unknown>;

      if (Array.isArray(og["choices"])) {
        const choices = (og["choices"] as unknown[])
          .map((choice: unknown, choiceIndex: number) => {
            if (!choice || typeof choice !== "object") return null;
            const c = choice as Record<string, unknown>;
            const choiceName =
              typeof c["name"] === "string"
                ? c["name"].trim()
                : typeof c["value"] === "string"
                  ? c["value"].trim()
                  : "";
            if (!choiceName) return null;
            return {
              id:
                typeof c["id"] === "string" && c["id"].trim()
                  ? c["id"].trim()
                  : `choice-${groupIndex + 1}-${choiceIndex + 1}`,
              name: choiceName,
              price: toPriceNumber(c["price"]),
            };
          })
          .filter(Boolean) as { id: string; name: string; price: number }[];

        if (choices.length === 0) return null;

        const groupName =
          typeof og["name"] === "string" && og["name"].trim()
            ? og["name"].trim()
            : `Option ${groupIndex + 1}`;

        return {
          id:
            typeof og["id"] === "string" && og["id"].trim()
              ? og["id"].trim()
              : `group-${groupIndex + 1}`,
          name: groupName,
          required: Boolean(og["required"]),
          choices,
        };
      }

      if (typeof og["value"] === "string" && og["value"].trim()) {
        return {
          id: `group-${groupIndex + 1}`,
          name: "Options",
          required: false,
          choices: [
            {
              id:
                typeof og["id"] === "string" && og["id"].trim()
                  ? og["id"].trim()
                  : `choice-${groupIndex + 1}-1`,
              name: og["value"].trim(),
              price: 0,
            },
          ],
        };
      }

      return null;
    })
    .filter(Boolean) as EventProductItem["optionGroups"];

  const fallbackOptionChipValues = mappedOptionGroups
    .flatMap((group) => group.choices.map((choice) => choice.name))
    .slice(0, 6);

  const itemId =
    typeof item["id"] === "string" && item["id"].trim()
      ? item["id"].trim()
      : `item-${index + 1}`;

  return {
    id: itemId,
    name: itemName || `Item ${index + 1}`,
    description: itemDescription,
    normalPrice: basePrice,
    basePrice,
    price: `$${basePrice.toFixed(2)}`,
    groupPrice: toPriceNumber(item["groupPrice"]),
    groupDiscountPercent: toPriceNumber(item["groupDiscountPercent"]),
    qtyThreshold: Number.isFinite(Number(item["qtyThreshold"]))
      ? Number(item["qtyThreshold"])
      : 0,
    stock: Number.isFinite(Number(item["stock"])) ? Number(item["stock"]) : 0,
    totalGroupQty:
      typeof item["id"] === "string" && item["id"].trim()
        ? toNumber(productGroupQtyMap[item["id"].trim()], 0)
        : 0,
    imagePreviewUrl:
      typeof item["imagePreviewUrl"] === "string"
        ? item["imagePreviewUrl"]
        : "",
    options: fallbackOptionChipValues,
    optionGroups: mappedOptionGroups,
  };
};

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
