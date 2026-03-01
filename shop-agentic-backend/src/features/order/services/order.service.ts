import admin from "@/app/config/firebaseAdmin";
import {
  EVENTS_COLLECTION,
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
import { assertActor } from "@/shared/utils/assert-actor";
import { toNumber } from "@/shared/utils/firestore.utils";
import type { DecodedIdToken } from "firebase-admin/auth";
import { assertGroupMember, getEventOrThrow } from "./order-helpers";
import { calcLineItem, calcOrderBreakdown } from "./order-pricing";

const db = admin.firestore();

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
  const minMembers = toNumber(
    (groupBuyRules as Record<string, unknown>)["minMembers"],
    0,
  );
  const currentMembers = toNumber(
    event["currentCount"] ?? event["buyCount"],
    0,
  );
  const membersNeededForDiscount = Math.max(0, minMembers - currentMembers);
  // The *configured* extra discount percent regardless of whether the threshold
  // has been reached — used by the UI to show "giảm thêm X%" text.
  const potentialExtraDiscountPercent = toNumber(
    (groupBuyRules as Record<string, unknown>)["extraDiscountPercent"],
    0,
  );

  return {
    ...breakdown,
    eventId,
    isGroupBuy,
    currentMembers,
    minMembers,
    membersNeededForDiscount,
    potentialExtraDiscountPercent,
    willGetExtraDiscount:
      membersNeededForDiscount === 0 && potentialExtraDiscountPercent > 0,
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

      // Increment buyCount so real-time listeners can track group size
      incrementUpdates["buyCount"] = admin.firestore.FieldValue.increment(1);
      incrementUpdates["updatedAt"] = now;
      transaction.update(eventRef, incrementUpdates);

      // Write join activity for real-time toast notifications
      const activityRef = eventRef.collection("groupBuyActivity").doc();
      transaction.set(activityRef, {
        uid: actor.uid,
        displayName:
          actor.name ??
          (actor as Record<string, unknown>)["displayName"] ??
          actor.email ??
          "Thành viên",
        email: actor.email ?? "",
        action: "joined",
        orderItemCount: breakdown.orderItems.length,
        joinedAt: now,
      });
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

  const normalizedPage = Math.max(1, toNumber(page, 1));
  const normalizedPageSize = Math.max(1, Math.min(toNumber(pageSize, 20), 100));

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

// Re-export for unit-testing
export { calcLineItem, calcOrderBreakdown };
