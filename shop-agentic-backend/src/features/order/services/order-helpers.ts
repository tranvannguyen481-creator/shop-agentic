import admin from "@/app/config/firebaseAdmin";
import {
  EVENTS_COLLECTION,
  GROUPS_COLLECTION,
} from "@/features/order/constants/order.constants";
import { AppError } from "@/shared/exceptions/AppError";
import type { DecodedIdToken } from "firebase-admin/auth";

const db = admin.firestore();

export async function getEventOrThrow(
  eventId: string,
): Promise<Record<string, unknown> & { id: string }> {
  const snap = await db.collection(EVENTS_COLLECTION).doc(eventId).get();
  if (!snap.exists) throw AppError.notFound("Event không tồn tại");
  return { id: snap.id, ...(snap.data() as Record<string, unknown>) };
}

export async function assertGroupMember(
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

export const findProduct = (
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
