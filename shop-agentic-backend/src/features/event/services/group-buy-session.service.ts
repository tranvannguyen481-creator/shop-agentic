/**
 * Group Buy Session Service
 *
 * Manages the lifecycle of a group-buy session scoped to an event:
 *  - join:     Any group member toggles "Mua nhóm" ON  → enters the session
 *  - dissolve: Group owner cancels the session
 *  - leave:    Non-owner member exits the session
 *
 * Firestore layout:
 *   events/:eventId/groupBuySession (single doc "current")
 *     { status: 'active'|'dissolved', hostUid, createdAt, updatedAt }
 *
 *   events/:eventId/groupBuyParticipants/:uid
 *     { uid, displayName, email, isHost, joinedAt }
 */

import admin from "@/app/config/firebaseAdmin";
import {
  EVENTS_COLLECTION,
  GROUPS_COLLECTION,
} from "@/features/order/constants/order.constants";
import { AppError } from "@/shared/exceptions/AppError";
import { assertActor } from "@/shared/utils/assert-actor";
import { normalizeEmail } from "@/shared/utils/firestore.utils";
import type { DecodedIdToken } from "firebase-admin/auth";

const db = admin.firestore();

const SESSION_DOC = "current";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroupBuyParticipant {
  uid: string;
  displayName: string;
  email: string;
  isHost: boolean;
  joinedAt: number;
}

export interface GroupBuySessionInfo {
  isHost: boolean;
  participantCount: number;
  sessionActive: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getGroupForEvent(
  groupId: string,
): Promise<{ ownerUid: string; memberUids: string[]; memberEmails: string[] }> {
  const snap = await db.collection(GROUPS_COLLECTION).doc(groupId).get();
  if (!snap.exists) throw AppError.notFound("Group không tồn tại");
  const data = (snap.data() ?? {}) as Record<string, unknown>;
  return {
    ownerUid: String(data["ownerUid"] ?? ""),
    memberUids: Array.isArray(data["memberUids"])
      ? (data["memberUids"] as string[])
      : [],
    memberEmails: Array.isArray(data["memberEmails"])
      ? (data["memberEmails"] as string[]).map((e) => normalizeEmail(e))
      : [],
  };
}

function resolveDisplayName(actor: DecodedIdToken): string {
  return (
    actor.name ??
    ((actor as Record<string, unknown>)["displayName"] as string) ??
    actor.email ??
    "Thành viên"
  );
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Join (or start) a group-buy session for the given event.
 * - Any valid group member can join.
 * - The group owner is automatically treated as the host.
 * - If no active session exists, a new one is created.
 */
export async function joinGroupBuySession(
  eventId: string,
  actor: DecodedIdToken,
): Promise<GroupBuySessionInfo> {
  assertActor(actor);

  // Validate event exists and get its group
  const eventSnap = await db.collection(EVENTS_COLLECTION).doc(eventId).get();
  if (!eventSnap.exists) throw AppError.notFound("Event không tồn tại");
  const event = (eventSnap.data() ?? {}) as Record<string, unknown>;

  const groupId = typeof event["groupId"] === "string" ? event["groupId"] : "";
  if (!groupId) {
    throw AppError.badRequest("Event này không thuộc nhóm nào");
  }

  // Confirm membership & determine host role
  const group = await getGroupForEvent(groupId);
  const actorEmail = normalizeEmail(actor.email ?? "");
  const isMember =
    group.ownerUid === actor.uid ||
    group.memberUids.includes(actor.uid) ||
    (actorEmail !== "" && group.memberEmails.includes(actorEmail));

  if (!isMember) {
    throw AppError.forbidden("Bạn không phải thành viên của nhóm này");
  }

  const isHost = group.ownerUid === actor.uid;
  const now = Date.now();

  const sessionRef = db
    .collection(EVENTS_COLLECTION)
    .doc(eventId)
    .collection("groupBuySession")
    .doc(SESSION_DOC);

  const participantRef = db
    .collection(EVENTS_COLLECTION)
    .doc(eventId)
    .collection("groupBuyParticipants")
    .doc(actor.uid);

  // Create session if it doesn't exist or was dissolved
  await db.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    const sessionData = sessionSnap.data() as
      | { status: string; hostUid: string }
      | undefined;

    if (!sessionSnap.exists || sessionData?.status === "dissolved") {
      tx.set(sessionRef, {
        status: "active",
        hostUid: isHost ? actor.uid : group.ownerUid,
        createdAt: now,
        updatedAt: now,
      });
    } else if (sessionData?.status !== "active") {
      throw AppError.badRequest("Phiên mua nhóm không còn hoạt động");
    }

    tx.set(participantRef, {
      uid: actor.uid,
      displayName: resolveDisplayName(actor),
      email: actor.email ?? "",
      isHost,
      joinedAt: now,
    });
  });

  // Count participants after joining
  const participantsSnap = await db
    .collection(EVENTS_COLLECTION)
    .doc(eventId)
    .collection("groupBuyParticipants")
    .count()
    .get();

  return {
    isHost,
    participantCount: participantsSnap.data().count,
    sessionActive: true,
  };
}

/**
 * Dissolve the group-buy session — host only.
 * Marks the session as dissolved and removes all participants.
 */
export async function dissolveGroupBuySession(
  eventId: string,
  actor: DecodedIdToken,
): Promise<{ success: boolean }> {
  assertActor(actor);

  const eventSnap = await db.collection(EVENTS_COLLECTION).doc(eventId).get();
  if (!eventSnap.exists) throw AppError.notFound("Event không tồn tại");
  const event = (eventSnap.data() ?? {}) as Record<string, unknown>;

  const groupId = typeof event["groupId"] === "string" ? event["groupId"] : "";
  if (!groupId) throw AppError.badRequest("Event này không thuộc nhóm nào");

  const group = await getGroupForEvent(groupId);
  if (group.ownerUid !== actor.uid) {
    throw AppError.forbidden(
      "Chỉ host nhóm mới có thể giải tán phiên mua nhóm",
    );
  }

  const eventDocRef = db.collection(EVENTS_COLLECTION).doc(eventId);
  const sessionRef = eventDocRef.collection("groupBuySession").doc(SESSION_DOC);

  const now = Date.now();

  // Mark session dissolved
  await sessionRef.set(
    { status: "dissolved", dissolvedAt: now, updatedAt: now },
    { merge: true },
  );

  // Batch-delete all participants
  const participantsSnap = await eventDocRef
    .collection("groupBuyParticipants")
    .limit(500)
    .get();

  if (!participantsSnap.empty) {
    const batch = db.batch();
    participantsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  return { success: true };
}

/**
 * Leave the group-buy session — non-host members only.
 */
export async function leaveGroupBuySession(
  eventId: string,
  actor: DecodedIdToken,
): Promise<{ success: boolean }> {
  assertActor(actor);

  const eventSnap = await db.collection(EVENTS_COLLECTION).doc(eventId).get();
  if (!eventSnap.exists) throw AppError.notFound("Event không tồn tại");
  const event = (eventSnap.data() ?? {}) as Record<string, unknown>;

  const groupId = typeof event["groupId"] === "string" ? event["groupId"] : "";
  if (!groupId) throw AppError.badRequest("Event này không thuộc nhóm nào");

  const group = await getGroupForEvent(groupId);
  if (group.ownerUid === actor.uid) {
    throw AppError.badRequest(
      "Host không thể rời nhóm — hãy dùng tính năng giải tán nhóm",
    );
  }

  const participantRef = db
    .collection(EVENTS_COLLECTION)
    .doc(eventId)
    .collection("groupBuyParticipants")
    .doc(actor.uid);

  await participantRef.delete();

  return { success: true };
}
