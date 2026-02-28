import admin from "@/app/config/firebaseAdmin";
import {
  DEFAULT_VAT_RATE,
  EVENTS_COLLECTION,
  GROUPS_COLLECTION,
  ORDERS_COLLECTION,
} from "@/features/order/constants/order.constants";
import type {
  CalculateOrderBody,
  PlaceOrderBody,
} from "@/features/order/dtos/order.dto";
import {
  ORDER_STATUS,
  ORDER_TYPE,
  type LineItem,
  type OrderBreakdown,
  type OrderDocument,
} from "@/features/order/types/order.types";
import { AppError } from "@/shared/exceptions/AppError";
import type { DecodedIdToken } from "firebase-admin/auth";

const db = admin.firestore();

// ─── Helpers ────────────────────────────────────────────────────────────────

const toNum = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function assertActor(
  actor: DecodedIdToken | undefined,
): asserts actor is DecodedIdToken {
  if (!actor?.uid) throw AppError.unauthorized();
}

async function getEventOrThrow(
  eventId: string,
): Promise<Record<string, unknown> & { id: string }> {
  const snap = await db.collection(EVENTS_COLLECTION).doc(eventId).get();
  if (!snap.exists) throw AppError.notFound("Event không tồn tại");
  return { id: snap.id, ...(snap.data() as Record<string, unknown>) };
}

async function assertGroupMember(
  groupId: string,
  actor: DecodedIdToken,
): Promise<void> {
  const snap = await db.collection(GROUPS_COLLECTION).doc(groupId).get();
  if (!snap.exists) throw AppError.notFound("Group không tồn tại");

  const group = (snap.data() ?? {}) as Record<string, unknown>;
  const uid = actor.uid;
  const email =
    typeof actor.email === "string" ? actor.email.trim().toLowerCase() : "";

  const memberUids = Array.isArray(group["memberUids"])
    ? (group["memberUids"] as string[])
    : [];
  const memberEmails = Array.isArray(group["memberEmails"])
    ? (group["memberEmails"] as string[]).map((e) => e.trim().toLowerCase())
    : [];

  const isMember =
    group["ownerUid"] === uid ||
    memberUids.includes(uid) ||
    (email !== "" && memberEmails.includes(email));

  if (!isMember)
    throw AppError.forbidden("Bạn không phải thành viên của group này");
}

const findProduct = (
  event: Record<string, unknown>,
  productId: string,
): (Record<string, unknown> & { id: string }) | null => {
  const items = Array.isArray(event["items"])
    ? (event["items"] as Array<Record<string, unknown>>)
    : [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== "object") continue;
    const resolvedId =
      typeof item["id"] === "string" && (item["id"] as string).trim()
        ? (item["id"] as string).trim()
        : `item-${i + 1}`;
    if (resolvedId === productId) return { ...item, id: resolvedId };
  }
  return null;
};

// ─── Core Pricing Engine ─────────────────────────────────────────────────────

function calcLineItem(
  product: Record<string, unknown> & { id: string },
  qty: number,
  isGroupBuy: boolean,
  currentGroupQty = 0,
): LineItem {
  const normalPrice = toNum(
    product["basePrice"] ?? product["normalPrice"] ?? product["price"],
    0,
  );
  const groupDiscountPercent = toNum(product["groupDiscountPercent"], 0);
  const qtyThreshold = toNum(product["qtyThreshold"], 0);
  const groupPrice = toNum(product["groupPrice"], 0);

  let basePrice: number;
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

  let itemDiscountPercent = 0;
  if (
    isGroupBuy &&
    qtyThreshold > 0 &&
    currentGroupQty + qty >= qtyThreshold &&
    groupPrice === 0
  ) {
    itemDiscountPercent = groupDiscountPercent;
  }

  const discountedUnitPrice = Math.round(
    basePrice * (1 - itemDiscountPercent / 100),
  );
  const lineTotalBeforeVat = discountedUnitPrice * qty;
  const discountAmount = (basePrice - discountedUnitPrice) * qty;

  return {
    productId:
      typeof product["id"] === "string"
        ? product["id"]
        : typeof product["productId"] === "string"
          ? product["productId"]
          : "",
    productName: typeof product["name"] === "string" ? product["name"] : "",
    qty,
    normalPrice,
    basePrice,
    itemDiscountPercent,
    discountAmount,
    discountedUnitPrice,
    lineTotalBeforeVat,
  };
}

function calcOrderBreakdown(
  event: Record<string, unknown>,
  items: Array<{ productId: string; qty: number }>,
  isGroupBuy: boolean,
): OrderBreakdown {
  const vatRate = toNum(event["vatRate"], DEFAULT_VAT_RATE);
  const discountRules = (event["discountRules"] ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const groupBuyRules = discountRules["groupBuy"] ?? {};
  const productGroupQty = (event["productGroupQty"] ?? {}) as Record<
    string,
    unknown
  >;

  const orderItems = items.map((inputItem) => {
    const product = findProduct(event, inputItem.productId);
    if (!product) {
      throw AppError.badRequest(
        `Sản phẩm "${inputItem.productId}" không tìm thấy trong event`,
      );
    }
    const currentGroupQty = toNum(productGroupQty[inputItem.productId], 0);
    return calcLineItem(product, inputItem.qty, isGroupBuy, currentGroupQty);
  });

  const subtotalBeforeDiscount = orderItems.reduce(
    (sum, li) => sum + li.lineTotalBeforeVat,
    0,
  );

  let extraGroupDiscountPercent = 0;
  let extraGroupDiscount = 0;

  if (
    isGroupBuy &&
    groupBuyRules["enabled"] &&
    toNum(groupBuyRules["extraDiscountPercent"], 0) > 0
  ) {
    const joinedCount = toNum(event["currentCount"] ?? event["buyCount"], 0);
    const minMembers = toNum(groupBuyRules["minMembers"], 0);

    if (joinedCount >= minMembers && minMembers > 0) {
      extraGroupDiscountPercent = toNum(
        groupBuyRules["extraDiscountPercent"],
        0,
      );
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

export async function calculateOrder(
  actor: DecodedIdToken,
  { eventId, items, isGroupBuy }: CalculateOrderBody,
) {
  assertActor(actor);

  const event = await getEventOrThrow(eventId);
  if (event["groupId"]) {
    await assertGroupMember(event["groupId"] as string, actor);
  }

  const breakdown = calcOrderBreakdown(event, items, isGroupBuy);

  const groupBuyRules =
    ((event["discountRules"] as Record<string, unknown> | undefined) ?? {})[
      "groupBuy"
    ] ?? ({} as Record<string, unknown>);
  const minMembers = toNum(
    (groupBuyRules as Record<string, unknown>)["minMembers"],
    0,
  );
  const currentMembers = toNum(event["currentCount"] ?? event["buyCount"], 0);
  const membersNeededForDiscount = Math.max(0, minMembers - currentMembers);

  return {
    ...breakdown,
    eventId,
    isGroupBuy,
    currentMembers,
    minMembers,
    membersNeededForDiscount,
    willGetExtraDiscount:
      membersNeededForDiscount === 0 &&
      toNum(
        (groupBuyRules as Record<string, unknown>)["extraDiscountPercent"],
        0,
      ) > 0,
  };
}

export async function placeOrder(
  actor: DecodedIdToken,
  {
    eventId,
    items,
    isGroupBuy,
    paymentMethod,
    deliveryAddress,
    note,
  }: PlaceOrderBody,
): Promise<{
  orderId: string;
  grandTotal: number;
  breakdown: Omit<OrderBreakdown, "orderItems">;
  items: LineItem[];
  status: string;
}> {
  assertActor(actor);

  const event = await getEventOrThrow(eventId);

  if (event["status"] && event["status"] !== "active") {
    throw AppError.badRequest("Event đã kết thúc, không thể đặt hàng");
  }

  if (event["groupId"]) {
    await assertGroupMember(event["groupId"] as string, actor);
  }

  const breakdown = calcOrderBreakdown(event, items, isGroupBuy);
  const now = Date.now();

  const orderPayload = {
    userUid: actor.uid,
    userEmail: actor.email ?? "",
    userDisplayName: actor.name ?? "",
    eventId,
    groupId: event["groupId"] ?? "",
    type: isGroupBuy ? ORDER_TYPE.GROUP : ORDER_TYPE.INDIVIDUAL,
    items: breakdown.orderItems,
    subtotalBeforeDiscount: breakdown.subtotalBeforeDiscount,
    extraGroupDiscountPercent: breakdown.extraGroupDiscountPercent,
    totalDiscount: breakdown.extraGroupDiscount,
    subtotalAfterDiscount: breakdown.subtotalAfterDiscount,
    vatRate: breakdown.vatRate,
    vatAmount: breakdown.vatAmount,
    grandTotal: breakdown.grandTotal,
    paymentMethod: paymentMethod ?? "cod",
    deliveryAddress: deliveryAddress ?? "",
    note: note ?? "",
    status: ORDER_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
  };

  const orderRef = db.collection(ORDERS_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    transaction.set(orderRef, orderPayload);

    if (isGroupBuy) {
      const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
      const incrementUpdates: Record<string, unknown> = {};

      breakdown.orderItems.forEach((li) => {
        incrementUpdates[`productGroupQty.${li.productId}`] =
          admin.firestore.FieldValue.increment(li.qty);
      });

      incrementUpdates["updatedAt"] = now;
      transaction.update(eventRef, incrementUpdates);
    }
  });

  return {
    orderId: orderRef.id,
    grandTotal: breakdown.grandTotal,
    breakdown: {
      subtotalBeforeDiscount: breakdown.subtotalBeforeDiscount,
      extraGroupDiscountPercent: breakdown.extraGroupDiscountPercent,
      extraGroupDiscount: breakdown.extraGroupDiscount,
      subtotalAfterDiscount: breakdown.subtotalAfterDiscount,
      vatRate: breakdown.vatRate,
      vatAmount: breakdown.vatAmount,
      grandTotal: breakdown.grandTotal,
    },
    items: breakdown.orderItems,
    status: ORDER_STATUS.PENDING,
  };
}

export async function getOrderDetail(
  actor: DecodedIdToken,
  orderId: string,
): Promise<OrderDocument> {
  assertActor(actor);

  const snap = await db.collection(ORDERS_COLLECTION).doc(orderId).get();
  if (!snap.exists) throw AppError.notFound("Đơn hàng không tồn tại");

  const order = (snap.data() ?? {}) as Omit<OrderDocument, "id">;
  if (order.userUid !== actor.uid)
    throw AppError.forbidden("Bạn không có quyền xem đơn hàng này");

  return { id: snap.id, ...order };
}

export async function listMyOrders(
  actor: DecodedIdToken,
  {
    page = 1,
    pageSize = 20,
    eventId,
    status,
  }: {
    page?: number;
    pageSize?: number;
    eventId?: string;
    status?: string;
  } = {},
): Promise<{
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
}> {
  assertActor(actor);

  const normalizedPage = Math.max(1, toNum(page, 1));
  const normalizedPageSize = Math.max(1, Math.min(toNum(pageSize, 20), 100));

  let query = db
    .collection(ORDERS_COLLECTION)
    .where("userUid", "==", actor.uid)
    .orderBy("createdAt", "desc") as FirebaseFirestore.Query;

  if (eventId) query = query.where("eventId", "==", eventId);
  if (status) query = query.where("status", "==", status);

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

export async function listEventOrders(
  actor: DecodedIdToken,
  eventId: string,
): Promise<unknown[]> {
  assertActor(actor);

  const event = await getEventOrThrow(eventId);

  if (event["hostUid"] !== actor.uid && event["userId"] !== actor.uid) {
    throw AppError.forbidden("Chỉ host mới được xem tất cả đơn hàng của event");
  }

  const snapshot = await db
    .collection(ORDERS_COLLECTION)
    .where("eventId", "==", eventId)
    .orderBy("createdAt", "desc")
    .limit(500)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// export for unit-testing
export { calcLineItem, calcOrderBreakdown };
