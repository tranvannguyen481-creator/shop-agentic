const admin = require("../../../config/firebaseAdmin");
const {
  EVENTS_COLLECTION,
  GROUPS_COLLECTION,
  USER_HOSTED_EVENTS_COLLECTION,
} = require("../constants/event.constants");
const { EVENT_STATUS } = require("../types/event.types");

const db = admin.firestore();

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toPriceNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const toYearMonth = (closingDate, fallbackTimestamp) => {
  const parsedDate = new Date(closingDate || fallbackTimestamp);

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

const resolveGroupId = (data = {}) => {
  const createEventDraft = data.createEventDraft ?? data;

  const fromDraft =
    typeof createEventDraft.groupId === "string"
      ? createEventDraft.groupId.trim()
      : "";
  const fromRoot = typeof data.groupId === "string" ? data.groupId.trim() : "";

  return fromDraft || fromRoot;
};

const assertActor = (actor) => {
  if (!actor?.uid) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
};

async function getGroupForCreate(groupId, actor) {
  const groupSnapshot = await db
    .collection(GROUPS_COLLECTION)
    .doc(groupId)
    .get();

  if (!groupSnapshot.exists) {
    const error = new Error("Selected group not found");
    error.statusCode = 404;
    throw error;
  }

  const group = groupSnapshot.data() || {};
  const actorEmail = normalizeEmail(actor?.email || "");
  const memberEmails = Array.isArray(group.memberEmails)
    ? group.memberEmails.map((email) => normalizeEmail(email)).filter(Boolean)
    : [];
  const memberUids = Array.isArray(group.memberUids) ? group.memberUids : [];

  const canCreate =
    group.ownerUid === actor.uid ||
    memberUids.includes(actor.uid) ||
    (actorEmail && memberEmails.includes(actorEmail));

  if (!canCreate) {
    const error = new Error(
      "You are not allowed to create event in this group",
    );
    error.statusCode = 403;
    throw error;
  }

  return {
    id: groupSnapshot.id,
    ...group,
  };
}

const mapEventPayload = (data = {}, actor = null) => {
  const now = Date.now();
  const createEventDraft = data.createEventDraft ?? data;
  const createItemsDraft = data.createItemsDraft ?? {};
  const groupId = resolveGroupId(data);

  return {
    title: createEventDraft.title ?? "",
    description: createEventDraft.description ?? "",
    mode: createEventDraft.mode ?? "group-buy",
    pickupLocation: createEventDraft.pickupLocation ?? "",
    closingDate: createEventDraft.closingDate ?? "",
    collectionDate: createEventDraft.collectionDate ?? "",
    collectionTime: createEventDraft.collectionTime ?? "",
    paymentAfterClosing: Boolean(createEventDraft.paymentAfterClosing),
    payTogether: Boolean(createEventDraft.payTogether),
    adminFee: String(createEventDraft.adminFee ?? "0"),
    addImportantNotes: Boolean(createEventDraft.addImportantNotes),
    importantNotes: Array.isArray(createEventDraft.importantNotes)
      ? createEventDraft.importantNotes
      : [],
    addExternalUrl: Boolean(createEventDraft.addExternalUrl),
    externalUrlFieldName: createEventDraft.externalUrlFieldName ?? "",
    externalUrl: createEventDraft.externalUrl ?? "",
    addDeliveryOptions: Boolean(createEventDraft.addDeliveryOptions),
    deliveryScheduleDate: createEventDraft.deliveryScheduleDate ?? "",
    deliveryTimeFrom: createEventDraft.deliveryTimeFrom ?? "",
    deliveryTimeTo: createEventDraft.deliveryTimeTo ?? "",
    deliveryFees: Array.isArray(createEventDraft.deliveryFees)
      ? createEventDraft.deliveryFees
      : [],
    requestDeliveryDetails: Boolean(createEventDraft.requestDeliveryDetails),
    groupId,
    yearMonth: toYearMonth(createEventDraft.closingDate, now),
    items: (Array.isArray(createItemsDraft.items)
      ? createItemsDraft.items
      : []
    ).map((item) => ({
      ...item,
      // Đảm bảo mỗi item có ID ổn định (dùng Firestore doc ID nếu chưa có).
      // db.collection().doc().id chỉ sinh chuỗi, không tạo document thật.
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : db.collection("_").doc().id,
    })),
    bannerPreviewUrls: Array.isArray(createItemsDraft.bannerPreviewUrls)
      ? createItemsDraft.bannerPreviewUrls
      : [],
    currentCount: toNumber(data.currentCount, 0),
    buyCount: toNumber(data.buyCount, 0),
    totalPurchase: String(data.totalPurchase ?? "$0.00"),
    status: data.status ?? EVENT_STATUS.ACTIVE,
    userId: actor?.uid ?? data.userId ?? "",
    hostUid: actor?.uid ?? data.hostUid ?? "",
    hostEmail: actor?.email ?? data.hostEmail ?? "",
    hostDisplayName:
      actor?.name ?? actor?.displayName ?? data.hostDisplayName ?? "",
    createdAt: data.createdAt ?? now,
    updatedAt: now,
    // ── Pricing: thuế & group discount rules ──────────────────────────────
    // VAT 10% theo Luật Thuế GTGT VN 2024 & Thông tư 219/2013
    vatRate: typeof data.vatRate === "number" ? data.vatRate : 0.1,
    discountRules:
      data.discountRules && typeof data.discountRules === "object"
        ? {
            groupBuy: {
              enabled: Boolean(data.discountRules.groupBuy?.enabled ?? false),
              minMembers: toNumber(data.discountRules.groupBuy?.minMembers, 0),
              extraDiscountPercent: toNumber(
                data.discountRules.groupBuy?.extraDiscountPercent,
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
    // Tổng qty theo product đã được đặt dưới dạng group buy (cập nhật realtime)
    productGroupQty: data.productGroupQty || {},
  };
};

const mapEventListItem = (id, source = {}) => ({
  id,
  title: source.title ?? "",
  description: source.description ?? "",
  closingDate: source.closingDate ?? "",
  collectionDate: source.collectionDate ?? "",
  closingInText: source.closingInText ?? "closing in 2 hours",
  deliveryInText: source.deliveryInText ?? "Delivery in 6 days",
  buyCount: toNumber(source.buyCount, 0),
  totalPurchase: source.totalPurchase ?? "$0.00",
  adminFee: source.adminFee ?? "$0.00",
  status: source.status ?? EVENT_STATUS.ACTIVE,
  userId: source.userId ?? "",
  hostUid: source.hostUid ?? "",
  hostDisplayName: source.hostDisplayName ?? "",
  updatedAt: source.updatedAt ?? null,
  bannerPreviewUrls: Array.isArray(source.bannerPreviewUrls)
    ? source.bannerPreviewUrls
    : [],
});

const mapGroupEventListItem = (id, source = {}) => ({
  id,
  title: source.title ?? "",
  description: source.description ?? "",
  closingDate: source.closingDate ?? "",
  collectionDate: source.collectionDate ?? "",
  closingInText: source.closingInText ?? "closing in 2 hours",
  deliveryInText: source.deliveryInText ?? "Delivery in 6 days",
  buyCount: toNumber(source.buyCount, 0),
  totalPurchase: source.totalPurchase ?? "$0.00",
  adminFee: source.adminFee ?? "$0.00",
  status: source.status ?? EVENT_STATUS.ACTIVE,
  groupId: source.groupId ?? "",
  groupName: source.groupName ?? "",
  hostDisplayName: source.hostDisplayName ?? "",
  updatedAt: source.updatedAt ?? null,
});

const mapEventProductItem = (item = {}, index = 0, productGroupQtyMap = {}) => {
  const itemName = typeof item.name === "string" ? item.name.trim() : "";
  const itemDescription =
    typeof item.description === "string" ? item.description.trim() : "";
  const basePrice = toPriceNumber(item.price);
  const rawOptions = Array.isArray(item.options) ? item.options : [];

  const mappedOptionGroups = rawOptions
    .map((optionGroup, groupIndex) => {
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

      if (Array.isArray(optionGroup.choices)) {
        const choices = optionGroup.choices
          .map((choice, choiceIndex) => {
            if (!choice || typeof choice !== "object") {
              return null;
            }

            const choiceName =
              typeof choice.name === "string"
                ? choice.name.trim()
                : typeof choice.value === "string"
                  ? choice.value.trim()
                  : "";

            if (!choiceName) {
              return null;
            }

            return {
              id:
                typeof choice.id === "string" && choice.id.trim()
                  ? choice.id.trim()
                  : `choice-${groupIndex + 1}-${choiceIndex + 1}`,
              name: choiceName,
              price: toPriceNumber(choice.price),
            };
          })
          .filter(Boolean);

        if (choices.length === 0) {
          return null;
        }

        const groupName =
          typeof optionGroup.name === "string" && optionGroup.name.trim()
            ? optionGroup.name.trim()
            : `Option ${groupIndex + 1}`;

        return {
          id:
            typeof optionGroup.id === "string" && optionGroup.id.trim()
              ? optionGroup.id.trim()
              : `group-${groupIndex + 1}`,
          name: groupName,
          required: Boolean(optionGroup.required),
          choices,
        };
      }

      if (typeof optionGroup.value === "string" && optionGroup.value.trim()) {
        return {
          id: `group-${groupIndex + 1}`,
          name: "Options",
          required: false,
          choices: [
            {
              id:
                typeof optionGroup.id === "string" && optionGroup.id.trim()
                  ? optionGroup.id.trim()
                  : `choice-${groupIndex + 1}-1`,
              name: optionGroup.value.trim(),
              price: 0,
            },
          ],
        };
      }

      return null;
    })
    .filter(Boolean);

  const fallbackOptionChipValues = mappedOptionGroups
    .flatMap((group) => group.choices.map((choice) => choice.name))
    .slice(0, 6);

  return {
    // ID ổn định: với event mới luôn có (từ mapEventPayload);
    // fallback item-${n} chỉ còn cho event cũ trong Firestore chưa migrate.
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : `item-${index + 1}`,
    name: itemName || `Item ${index + 1}`,
    description: itemDescription,
    // Giá cơ bản (mua lẻ)
    normalPrice: basePrice,
    basePrice,
    price: `$${basePrice.toFixed(2)}`,
    // Giá nhóm: nhà host có thể nhập tay một giá cố định
    groupPrice: toPriceNumber(item.groupPrice),
    // % giảm giá khi mua nhóm (áp dụng khi không có groupPrice)
    groupDiscountPercent: toPriceNumber(item.groupDiscountPercent),
    // Ngưỡng số lượng toàn nhóm để kích hoạt groupDiscountPercent
    qtyThreshold: Number.isFinite(Number(item.qtyThreshold))
      ? Number(item.qtyThreshold)
      : 0,
    // Tồn kho (0 = không giới hạn)
    stock: Number.isFinite(Number(item.stock)) ? Number(item.stock) : 0,
    // Tổng số lượng sản phẩm này đã được mua bởi toàn nhóm (dùng để tính qtyThreshold)
    totalGroupQty:
      typeof item.id === "string" && item.id.trim()
        ? toNumber(productGroupQtyMap[item.id.trim()], 0)
        : 0,
    imagePreviewUrl:
      typeof item.imagePreviewUrl === "string" ? item.imagePreviewUrl : "",
    options: fallbackOptionChipValues,
    optionGroups: mappedOptionGroups,
  };
};

async function createEvent(data, actor) {
  assertActor(actor);

  const groupId = resolveGroupId(data);

  if (!groupId) {
    const error = new Error("groupId is required when creating event");
    error.statusCode = 400;
    throw error;
  }

  const group = await getGroupForCreate(groupId, actor);
  const eventRef = db.collection(EVENTS_COLLECTION).doc();
  const payload = {
    ...mapEventPayload(data, actor),
    groupId,
    groupName: typeof group.name === "string" ? group.name : "",
  };

  const hostedEventRef = db
    .collection(USER_HOSTED_EVENTS_COLLECTION)
    .doc(`${actor.uid}_${eventRef.id}`);

  const hostedEventPayload = {
    eventId: eventRef.id,
    hostUid: actor.uid,
    userId: actor.uid,
    groupId,
    status: payload.status,
    buyCount: toNumber(payload.buyCount, 0),
    totalPurchase: String(payload.totalPurchase ?? "$0.00"),
    yearMonth: payload.yearMonth,
    title: payload.title,
    closingDate: payload.closingDate,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };

  const batch = db.batch();
  batch.set(eventRef, payload);
  batch.set(hostedEventRef, hostedEventPayload);
  await batch.commit();

  return {
    eventId: eventRef.id,
    groupId,
  };
}

async function listEvents({ page = 1, pageSize = 20 } = {}) {
  const normalizedPage = Math.max(1, toNumber(page, 1));
  const normalizedPageSize = Math.max(1, toNumber(pageSize, 20));

  const snapshot = await db
    .collection(EVENTS_COLLECTION)
    .orderBy("updatedAt", "desc")
    .limit(200)
    .get();

  const allItems = snapshot.docs.map((doc) =>
    mapEventListItem(doc.id, doc.data() || {}),
  );

  const start = (normalizedPage - 1) * normalizedPageSize;
  const items = allItems.slice(start, start + normalizedPageSize);

  return {
    items,
    total: allItems.length,
  };
}

async function listHostedEvents(actor, { page = 1, pageSize = 20 } = {}) {
  const hostUid = actor?.uid || "";
  const hostEmail =
    typeof actor?.email === "string" ? actor.email.toLowerCase() : "";

  if (!hostUid && !hostEmail) {
    return {
      items: [],
      total: 0,
    };
  }

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
    );

    queryTasks.push(
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
  const mergedById = new Map();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      mergedById.set(doc.id, mapEventListItem(doc.id, doc.data() || {}));
    });
  });

  if (mergedById.size === 0 && process.env.NODE_ENV !== "production") {
    const fallbackSnapshot = await db
      .collection(EVENTS_COLLECTION)
      .orderBy("updatedAt", "desc")
      .limit(200)
      .get();

    fallbackSnapshot.docs.forEach((doc) => {
      const source = doc.data() || {};
      const sourceEmail =
        typeof source.hostEmail === "string"
          ? source.hostEmail.toLowerCase()
          : "";

      if (
        hostUid &&
        (source.hostUid === hostUid || source.userId === hostUid)
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
    (left, right) => toNumber(right.updatedAt, 0) - toNumber(left.updatedAt, 0),
  );

  const start = (normalizedPage - 1) * normalizedPageSize;
  const items = allItems.slice(start, start + normalizedPageSize);

  return {
    items,
    total: allItems.length,
  };
}

async function joinEvent(eventId, user) {
  const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
  const participantRef = eventRef.collection("participants").doc(user.uid);

  await db.runTransaction(async (transaction) => {
    const event = await transaction.get(eventRef);

    if (!event.exists) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    if (event.data().status !== EVENT_STATUS.ACTIVE) {
      const error = new Error("Event ended");
      error.statusCode = 400;
      throw error;
    }

    transaction.set(participantRef, { ...user, joinedAt: Date.now() });
    transaction.update(eventRef, {
      currentCount: admin.firestore.FieldValue.increment(1),
      buyCount: admin.firestore.FieldValue.increment(1),
      updatedAt: Date.now(),
    });
  });
}

async function getEventEditDraft(eventId) {
  const eventSnapshot = await db
    .collection(EVENTS_COLLECTION)
    .doc(eventId)
    .get();

  if (!eventSnapshot.exists) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }

  const eventData = eventSnapshot.data() || {};

  return {
    createEventDraft: {
      mode: eventData.mode ?? "group-buy",
      title: eventData.title ?? "",
      description: eventData.description ?? "",
      pickupLocation: eventData.pickupLocation ?? "",
      closingDate: eventData.closingDate ?? "",
      collectionDate: eventData.collectionDate ?? "",
      collectionTime: eventData.collectionTime ?? "",
      paymentAfterClosing: Boolean(eventData.paymentAfterClosing),
      payTogether: Boolean(eventData.payTogether),
      adminFee: String(eventData.adminFee ?? "0"),
      addImportantNotes: Boolean(eventData.addImportantNotes),
      importantNotes: Array.isArray(eventData.importantNotes)
        ? eventData.importantNotes
        : [],
      addExternalUrl: Boolean(eventData.addExternalUrl),
      externalUrlFieldName: eventData.externalUrlFieldName ?? "",
      externalUrl: eventData.externalUrl ?? "",
      addDeliveryOptions: Boolean(eventData.addDeliveryOptions),
      deliveryScheduleDate: eventData.deliveryScheduleDate ?? "",
      deliveryTimeFrom: eventData.deliveryTimeFrom ?? "",
      deliveryTimeTo: eventData.deliveryTimeTo ?? "",
      deliveryFees: Array.isArray(eventData.deliveryFees)
        ? eventData.deliveryFees
        : [],
      requestDeliveryDetails: Boolean(eventData.requestDeliveryDetails),
    },
    createItemsDraft: {
      items: Array.isArray(eventData.items) ? eventData.items : [],
      bannerPreviewUrls: Array.isArray(eventData.bannerPreviewUrls)
        ? eventData.bannerPreviewUrls
        : [],
    },
  };
}

async function getManageOrdersData(eventId) {
  const eventSnapshot = await db
    .collection(EVENTS_COLLECTION)
    .doc(eventId)
    .get();

  if (!eventSnapshot.exists) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }

  const eventData = eventSnapshot.data() || {};

  return {
    title: eventData.title ?? "",
    closingDate: eventData.closingDate ?? "",
    collectionDate: eventData.collectionDate ?? "",
    closingInText: eventData.closingInText ?? "closing in 2 hours",
    deliveryInText: eventData.deliveryInText ?? "Delivery in 6 days",
    buyCount: toNumber(eventData.buyCount, 0),
    totalPurchase: eventData.totalPurchase ?? "$0.00",
    adminFee: eventData.adminFee ?? "$0.00",
  };
}

async function getEventDetail(eventId, actor) {
  const eventSnapshot = await db
    .collection(EVENTS_COLLECTION)
    .doc(eventId)
    .get();

  if (!eventSnapshot.exists) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }

  const eventData = eventSnapshot.data() || {};

  // Permission check: if event belongs to a group, actor must be a member
  if (actor?.uid && eventData.groupId) {
    try {
      await getGroupForCreate(eventData.groupId, actor);
    } catch {
      const error = new Error("You do not have permission to view this event");
      error.statusCode = 403;
      throw error;
    }
  }

  // Auto-close if closingDate has passed
  const nowMs = Date.now();
  let resolvedStatus = eventData.status ?? EVENT_STATUS.ACTIVE;
  if (resolvedStatus !== EVENT_STATUS.CLOSED && eventData.closingDate) {
    const closingMs = new Date(eventData.closingDate).getTime();
    if (Number.isFinite(closingMs) && closingMs < nowMs) {
      resolvedStatus = EVENT_STATUS.CLOSED;
      await db
        .collection(EVENTS_COLLECTION)
        .doc(eventId)
        .update({ status: EVENT_STATUS.CLOSED, updatedAt: nowMs });
    }
  }

  const rawItems = Array.isArray(eventData.items) ? eventData.items : [];

  return {
    id: eventSnapshot.id,
    title: eventData.title ?? "",
    description: eventData.description ?? "",
    closingDate: eventData.closingDate ?? "",
    closingInText: eventData.closingInText ?? "Closing soon",
    collectionDate: eventData.collectionDate ?? "",
    collectionTime: eventData.collectionTime ?? "",
    pickupLocation: eventData.pickupLocation ?? "",
    importantNotes: Array.isArray(eventData.importantNotes)
      ? eventData.importantNotes
      : [],
    bannerPreviewUrl:
      Array.isArray(eventData.bannerPreviewUrls) &&
      eventData.bannerPreviewUrls[0]
        ? eventData.bannerPreviewUrls[0]
        : "",
    hostDisplayName: eventData.hostDisplayName ?? "",
    buyCount: toNumber(eventData.buyCount, 0),
    currentCount: toNumber(eventData.currentCount, 0),
    adminFee: eventData.adminFee ?? "$0.00",
    status: resolvedStatus,
    groupId: eventData.groupId ?? "",
    groupName: eventData.groupName ?? "",
    // ── Pricing info ──────────────────────────────────────────────────────
    vatRate: toNumber(eventData.vatRate, 0.1),
    discountRules: eventData.discountRules || {
      groupBuy: { enabled: false, minMembers: 0, extraDiscountPercent: 0 },
    },
    productGroupQty: eventData.productGroupQty || {},
    products: rawItems.map((item, index) =>
      mapEventProductItem(item, index, eventData.productGroupQty || {}),
    ),
  };
}

async function listGroupEvents(
  actor,
  { page = 1, pageSize = 20, search = "" } = {},
) {
  assertActor(actor);

  const actorUid = actor.uid;
  const actorEmail = normalizeEmail(actor.email || "");
  const normalizedPage = Math.max(1, toNumber(page, 1));
  const normalizedPageSize = Math.max(1, Math.min(toNumber(pageSize, 20), 100));
  const normalizedSearch =
    typeof search === "string" ? search.trim().toLowerCase() : "";

  // Step 1: find all groups the user belongs to
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
  const groupIds = new Set();

  groupSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      groupIds.add(doc.id);
    });
  });

  if (groupIds.size === 0) {
    return { items: [], total: 0 };
  }

  // Step 2: query events belonging to those groups
  // Firestore `in` supports up to 30 values per query
  const groupIdArray = Array.from(groupIds);
  const CHUNK_SIZE = 30;
  const chunks = [];

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
  const mergedById = new Map();

  eventSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      mergedById.set(doc.id, mapGroupEventListItem(doc.id, doc.data() || {}));
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
  const items = allItems.slice(start, start + normalizedPageSize);

  return { items, total: allItems.length };
}

async function reHostEvent(sourceEventId, actor) {
  assertActor(actor);

  const sourceSnap = await db
    .collection(EVENTS_COLLECTION)
    .doc(sourceEventId)
    .get();

  if (!sourceSnap.exists) {
    const error = new Error("Source event not found");
    error.statusCode = 404;
    throw error;
  }

  const source = sourceSnap.data() || {};

  // Verify actor belongs to the same group
  if (source.groupId) {
    await getGroupForCreate(source.groupId, actor);
  }

  const now = Date.now();
  const newEventRef = db.collection(EVENTS_COLLECTION).doc();

  const payload = {
    title: source.title ?? "",
    description: source.description ?? "",
    mode: source.mode ?? "group-buy",
    pickupLocation: source.pickupLocation ?? "",
    paymentAfterClosing: Boolean(source.paymentAfterClosing),
    payTogether: Boolean(source.payTogether),
    adminFee: source.adminFee ?? "0",
    addImportantNotes: Boolean(source.addImportantNotes),
    importantNotes: Array.isArray(source.importantNotes)
      ? source.importantNotes
      : [],
    addExternalUrl: Boolean(source.addExternalUrl),
    externalUrlFieldName: source.externalUrlFieldName ?? "",
    externalUrl: source.externalUrl ?? "",
    addDeliveryOptions: Boolean(source.addDeliveryOptions),
    deliveryFees: Array.isArray(source.deliveryFees) ? source.deliveryFees : [],
    requestDeliveryDetails: Boolean(source.requestDeliveryDetails),
    items: (Array.isArray(source.items) ? source.items : []).map((item) => ({
      ...item,
      // Kế thừa ID gốc nếu có; không có thì sinh mới (đảm bảo backward compat)
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : db.collection("_").doc().id,
    })),
    bannerPreviewUrls: Array.isArray(source.bannerPreviewUrls)
      ? source.bannerPreviewUrls
      : [],
    groupId: source.groupId ?? "",
    groupName: source.groupName ?? "",
    // Clear scheduling fields — host must set new dates
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
    hostEmail: actor.email ?? source.hostEmail ?? "",
    hostDisplayName:
      actor.name ?? actor.displayName ?? source.hostDisplayName ?? "",
    createdAt: now,
    updatedAt: now,
  };

  const hostedEventRef = db
    .collection(USER_HOSTED_EVENTS_COLLECTION)
    .doc(`${actor.uid}_${newEventRef.id}`);

  const hostedEventPayload = {
    eventId: newEventRef.id,
    hostUid: actor.uid,
    userId: actor.uid,
    groupId: payload.groupId,
    status: payload.status,
    buyCount: 0,
    totalPurchase: "$0.00",
    yearMonth: "",
    title: payload.title,
    closingDate: "",
    sourceEventId,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(newEventRef, payload);
  batch.set(hostedEventRef, hostedEventPayload);
  await batch.commit();

  return {
    eventId: newEventRef.id,
    groupId: payload.groupId,
  };
}

module.exports = {
  createEvent,
  listEvents,
  listGroupEvents,
  listHostedEvents,
  joinEvent,
  getEventEditDraft,
  getManageOrdersData,
  getEventDetail,
  reHostEvent,
};
