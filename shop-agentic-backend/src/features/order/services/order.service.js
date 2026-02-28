const admin = require("../../../config/firebaseAdmin");
const {
  ORDERS_COLLECTION,
  EVENTS_COLLECTION,
  GROUPS_COLLECTION,
  DEFAULT_VAT_RATE,
} = require("../constants/order.constants");
const { ORDER_TYPE, ORDER_STATUS } = require("../types/order.types");

const db = admin.firestore();

// ─── Helpers ────────────────────────────────────────────────────────────────

const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const assertActor = (actor) => {
  if (!actor?.uid) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
};

/**
 * Get event document, throw 404 if not found.
 */
async function getEventOrThrow(eventId) {
  const snap = await db.collection(EVENTS_COLLECTION).doc(eventId).get();
  if (!snap.exists) {
    const err = new Error("Event không tồn tại");
    err.statusCode = 404;
    throw err;
  }
  return { id: snap.id, ...snap.data() };
}

/**
 * Verify the actor is a member of the group that owns the event.
 * Checks ownerUid, memberUids[], and memberEmails[].
 */
async function assertGroupMember(groupId, actor) {
  const snap = await db.collection(GROUPS_COLLECTION).doc(groupId).get();
  if (!snap.exists) {
    const err = new Error("Group không tồn tại");
    err.statusCode = 404;
    throw err;
  }

  const group = snap.data() || {};
  const uid = actor.uid;
  const email =
    typeof actor.email === "string" ? actor.email.trim().toLowerCase() : "";

  const memberUids = Array.isArray(group.memberUids) ? group.memberUids : [];
  const memberEmails = Array.isArray(group.memberEmails)
    ? group.memberEmails.map((e) => e.trim().toLowerCase())
    : [];

  const isMember =
    group.ownerUid === uid ||
    memberUids.includes(uid) ||
    (email && memberEmails.includes(email));

  if (!isMember) {
    const err = new Error("Bạn không phải thành viên của group này");
    err.statusCode = 403;
    throw err;
  }
}

/**
 * Find a product in the event's items array by productId.
 *
 * Uses the same ID resolution as mapEventProductItem on the frontend:
 *   - Explicit `item.id` field → use it
 *   - Otherwise fallback to `item-${index + 1}` (1-based)
 *
 * The returned object is guaranteed to have `id` set so that
 * calcLineItem and productGroupQty lookups work correctly.
 */
const findProduct = (event, productId) => {
  const items = Array.isArray(event.items) ? event.items : [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== "object") continue;
    const resolvedId =
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : `item-${i + 1}`;
    if (resolvedId === productId) {
      return { ...item, id: resolvedId };
    }
  }
  return null;
};

// ─── Core Pricing Engine ─────────────────────────────────────────────────────

/**
 * Tính giá 1 sản phẩm & subtotal trước VAT.
 *
 * Thứ tự ưu tiên giá group:
 *   1. product.groupPrice (giá cố định nhà host nhập tay)
 *   2. product.normalPrice * (1 - groupDiscountPercent / 100)
 *   3. Fallback về normalPrice nếu không còn gì
 *
 * qtyThreshold: tổng qty mua nhóm của sản phẩm này trong event đạt ngưỡng
 * thì áp dụng thêm groupDiscountPercent (per-product discount).
 *
 * @param {object} product    - Firestore product item
 * @param {number} qty        - Số lượng
 * @param {boolean} isGroupBuy
 * @param {number} currentGroupQty - Tổng qty group đã mua trước đó (từ event doc)
 * @returns {object} lineItem breakdown
 */
function calcLineItem(product, qty, isGroupBuy, currentGroupQty = 0) {
  const normalPrice = toNum(
    product.basePrice ?? product.normalPrice ?? product.price,
    0,
  );
  const groupDiscountPercent = toNum(product.groupDiscountPercent, 0);
  const qtyThreshold = toNum(product.qtyThreshold, 0);
  const groupPrice = toNum(product.groupPrice, 0);

  // 1. Determine base price
  let basePrice;
  if (isGroupBuy) {
    if (groupPrice > 0) {
      basePrice = groupPrice;
    } else if (groupDiscountPercent > 0) {
      basePrice = Math.round(normalPrice * (1 - groupDiscountPercent / 100));
    } else {
      basePrice = normalPrice;
    }
  } else {
    basePrice = normalPrice;
  }

  // 2. Item-level discount: apply groupDiscountPercent khi đạt qtyThreshold
  let itemDiscountPercent = 0;
  if (
    isGroupBuy &&
    qtyThreshold > 0 &&
    currentGroupQty + qty >= qtyThreshold &&
    groupPrice === 0 // chỉ áp dụng nếu chưa dùng groupPrice
  ) {
    itemDiscountPercent = groupDiscountPercent;
  }

  const discountedUnitPrice = Math.round(
    basePrice * (1 - itemDiscountPercent / 100),
  );
  const lineTotalBeforeVat = discountedUnitPrice * qty;
  const discountAmount = (basePrice - discountedUnitPrice) * qty;

  return {
    productId: product.id ?? product.productId ?? "",
    productName: product.name ?? "",
    qty,
    normalPrice,
    basePrice,
    itemDiscountPercent,
    discountAmount,
    discountedUnitPrice,
    lineTotalBeforeVat,
  };
}

/**
 * Tính toàn bộ breakdown cho 1 đơn hàng.
 *
 * @param {object} event         - Event document from Firestore
 * @param {Array}  items         - [{ productId, qty }]
 * @param {boolean} isGroupBuy
 * @returns {object} breakdown với grandTotal
 */
function calcOrderBreakdown(event, items, isGroupBuy) {
  const vatRate = toNum(event.vatRate, DEFAULT_VAT_RATE);
  const discountRules = event.discountRules || {};
  const groupBuyRules = discountRules.groupBuy || {};
  const productGroupQty = event.productGroupQty || {};

  const orderItems = items.map((inputItem) => {
    const product = findProduct(event, inputItem.productId);
    if (!product) {
      const err = new Error(
        `Sản phẩm "${inputItem.productId}" không tìm thấy trong event`,
      );
      err.statusCode = 400;
      throw err;
    }

    const currentGroupQty = toNum(productGroupQty[inputItem.productId], 0);
    return calcLineItem(product, inputItem.qty, isGroupBuy, currentGroupQty);
  });

  const subtotalBeforeDiscount = orderItems.reduce(
    (sum, li) => sum + li.lineTotalBeforeVat,
    0,
  );

  // Extra group discount: áp dụng nếu đủ số thành viên join event
  let extraGroupDiscountPercent = 0;
  let extraGroupDiscount = 0;

  if (
    isGroupBuy &&
    groupBuyRules.enabled &&
    groupBuyRules.extraDiscountPercent > 0
  ) {
    const joinedCount = toNum(event.currentCount ?? event.buyCount, 0);
    const minMembers = toNum(groupBuyRules.minMembers, 0);

    if (joinedCount >= minMembers && minMembers > 0) {
      extraGroupDiscountPercent = toNum(groupBuyRules.extraDiscountPercent, 0);
      extraGroupDiscount = Math.round(
        (subtotalBeforeDiscount * extraGroupDiscountPercent) / 100,
      );
    }
  }

  const subtotalAfterDiscount = subtotalBeforeDiscount - extraGroupDiscount;
  const vatAmount = Math.round(subtotalAfterDiscount * vatRate);
  const grandTotal = subtotalAfterDiscount + vatAmount;

  return {
    orderItems,
    subtotalBeforeDiscount,
    extraGroupDiscountPercent,
    extraGroupDiscount,
    subtotalAfterDiscount,
    vatRate,
    vatAmount,
    grandTotal,
  };
}

// ─── Service Functions ───────────────────────────────────────────────────────

/**
 * Preview pricing breakdown mà không lưu vào DB.
 * Dùng để hiển thị trên front-end trước khi người dùng confirm đặt hàng.
 */
async function calculateOrder(actor, { eventId, items, isGroupBuy }) {
  assertActor(actor);

  const event = await getEventOrThrow(eventId);

  if (event.groupId) {
    await assertGroupMember(event.groupId, actor);
  }

  const breakdown = calcOrderBreakdown(event, items, isGroupBuy);

  // Thông tin hỗ trợ UI "còn thiếu X người để giảm giá"
  const groupBuyRules = (event.discountRules || {}).groupBuy || {};
  const minMembers = toNum(groupBuyRules.minMembers, 0);
  const currentMembers = toNum(event.currentCount ?? event.buyCount, 0);
  const membersNeededForDiscount = Math.max(0, minMembers - currentMembers);

  return {
    ...breakdown,
    eventId,
    isGroupBuy,
    currentMembers,
    minMembers,
    membersNeededForDiscount,
    willGetExtraDiscount:
      membersNeededForDiscount === 0 && groupBuyRules.extraDiscountPercent > 0,
  };
}

/**
 * Đặt đơn hàng thực sự — lưu vào Firestore orders collection.
 * Đồng thời cập nhật productGroupQty và buyCount trên event document.
 */
async function placeOrder(
  actor,
  { eventId, items, isGroupBuy, paymentMethod, deliveryAddress, note },
) {
  assertActor(actor);

  const event = await getEventOrThrow(eventId);

  if (event.status && event.status !== "active") {
    const err = new Error("Event đã kết thúc, không thể đặt hàng");
    err.statusCode = 400;
    throw err;
  }

  if (event.groupId) {
    await assertGroupMember(event.groupId, actor);
  }

  const breakdown = calcOrderBreakdown(event, items, isGroupBuy);
  const now = Date.now();

  const orderPayload = {
    userUid: actor.uid,
    userEmail: actor.email || "",
    userDisplayName: actor.name || actor.displayName || "",
    eventId,
    groupId: event.groupId || "",
    type: isGroupBuy ? ORDER_TYPE.GROUP : ORDER_TYPE.INDIVIDUAL,
    items: breakdown.orderItems,
    subtotalBeforeDiscount: breakdown.subtotalBeforeDiscount,
    extraGroupDiscountPercent: breakdown.extraGroupDiscountPercent,
    totalDiscount: breakdown.extraGroupDiscount,
    subtotalAfterDiscount: breakdown.subtotalAfterDiscount,
    vatRate: breakdown.vatRate,
    vatAmount: breakdown.vatAmount,
    grandTotal: breakdown.grandTotal,
    paymentMethod: paymentMethod || "cod",
    deliveryAddress: deliveryAddress || "",
    note: note || "",
    status: ORDER_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
  };

  const orderRef = db.collection(ORDERS_COLLECTION).doc();

  // Atomic update: lưu order + cập nhật productGroupQty trên event
  await db.runTransaction(async (transaction) => {
    transaction.set(orderRef, orderPayload);

    if (isGroupBuy) {
      const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
      const incrementUpdates = {};

      breakdown.orderItems.forEach((li) => {
        incrementUpdates[`productGroupQty.${li.productId}`] =
          admin.firestore.FieldValue.increment(li.qty);
      });

      incrementUpdates.updatedAt = now;
      transaction.update(eventRef, incrementUpdates);
    }
  });

  return {
    orderId: orderRef.id,
    grandTotal: breakdown.grandTotal,
    breakdown: {
      subtotalBeforeDiscount: breakdown.subtotalBeforeDiscount,
      extraGroupDiscountPercent: breakdown.extraGroupDiscountPercent,
      totalDiscount: breakdown.extraGroupDiscount,
      subtotalAfterDiscount: breakdown.subtotalAfterDiscount,
      vatRate: breakdown.vatRate,
      vatAmount: breakdown.vatAmount,
      grandTotal: breakdown.grandTotal,
    },
    items: breakdown.orderItems,
    status: ORDER_STATUS.PENDING,
  };
}

/**
 * Lấy chi tiết 1 đơn hàng.
 */
async function getOrderDetail(actor, orderId) {
  assertActor(actor);

  const snap = await db.collection(ORDERS_COLLECTION).doc(orderId).get();
  if (!snap.exists) {
    const err = new Error("Đơn hàng không tồn tại");
    err.statusCode = 404;
    throw err;
  }

  const order = snap.data() || {};

  // Chỉ được xem đơn của mình (hoặc host của event)
  if (order.userUid !== actor.uid) {
    const err = new Error("Bạn không có quyền xem đơn hàng này");
    err.statusCode = 403;
    throw err;
  }

  return { id: snap.id, ...order };
}

/**
 * Lấy danh sách đơn hàng của user hiện tại với phân trang.
 */
async function listMyOrders(
  actor,
  { page = 1, pageSize = 20, eventId, status } = {},
) {
  assertActor(actor);

  const normalizedPage = Math.max(1, toNum(page, 1));
  const normalizedPageSize = Math.max(1, Math.min(toNum(pageSize, 20), 100));

  let query = db
    .collection(ORDERS_COLLECTION)
    .where("userUid", "==", actor.uid)
    .orderBy("createdAt", "desc");

  if (eventId) {
    query = query.where("eventId", "==", eventId);
  }

  if (status) {
    query = query.where("status", "==", status);
  }

  const snapshot = await query
    .limit(normalizedPage * normalizedPageSize + 1)
    .get();
  const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const start = (normalizedPage - 1) * normalizedPageSize;
  const items = all.slice(start, start + normalizedPageSize);

  return {
    items,
    total: all.length,
    page: normalizedPage,
    pageSize: normalizedPageSize,
  };
}

/**
 * Lấy tất cả đơn hàng của 1 event (host xem).
 */
async function listEventOrders(actor, eventId) {
  assertActor(actor);

  const event = await getEventOrThrow(eventId);

  if (event.hostUid !== actor.uid && event.userId !== actor.uid) {
    const err = new Error("Chỉ host mới được xem tất cả đơn hàng của event");
    err.statusCode = 403;
    throw err;
  }

  const snapshot = await db
    .collection(ORDERS_COLLECTION)
    .where("eventId", "==", eventId)
    .orderBy("createdAt", "desc")
    .limit(500)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

module.exports = {
  calculateOrder,
  placeOrder,
  getOrderDetail,
  listMyOrders,
  listEventOrders,
  // export for testing
  calcOrderBreakdown,
  calcLineItem,
};
