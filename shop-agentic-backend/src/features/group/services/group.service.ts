import admin from "@/app/config/firebaseAdmin";
import { GROUPS_COLLECTION } from "@/features/group/constants/group.constants";
import type {
  AddGroupMemberBody,
  CreateGroupBody,
  RequestJoinGroupBody,
  UpdateGroupSettingsBody,
} from "@/features/group/dtos/group.dto";
import {
  GROUP_STATUS,
  type GroupDetail,
  type GroupListItem,
} from "@/features/group/types/group.types";
import {
  JOIN_REQUEST_STATUS,
  type JoinRequestItem,
} from "@/features/group/types/join-request.types";
import { AppError } from "@/shared/exceptions/AppError";
import { assertActor } from "@/shared/utils/assert-actor";
import {
  normalizeEmail,
  normalizeText,
  toNumber,
} from "@/shared/utils/firestore.utils";
import type { DecodedIdToken } from "firebase-admin/auth";
import {
  assertMemberAccess,
  assertOwner,
  getGroupOrThrow,
  type GroupSource,
} from "./group-helpers";
import { buildShareLink, generateUniqueInviteCode } from "./group-invite";
import { mapGroupListItem } from "./group-mappers";

const db = admin.firestore();

// ─── Service Functions ───────────────────────────────────────────────────────

export async function listMyGroups(
  actor: DecodedIdToken,
  { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {},
): Promise<{ items: GroupListItem[]; total: number }> {
  assertActor(actor);

  const actorUid = actor.uid;
  const actorEmail = normalizeEmail(actor.email ?? "");
  const normalizedPage = Math.max(1, toNumber(page, 1));
  const normalizedPageSize = Math.max(1, toNumber(pageSize, 20));

  const queryTasks = [
    db
      .collection(GROUPS_COLLECTION)
      .where("ownerUid", "==", actorUid)
      .limit(200)
      .get(),
  ];

  if (actorEmail) {
    queryTasks.push(
      db
        .collection(GROUPS_COLLECTION)
        .where("memberEmails", "array-contains", actorEmail)
        .limit(200)
        .get(),
    );
  }

  const snapshots = await Promise.all(queryTasks);
  const mergedById = new Map<string, GroupListItem & { isMember: boolean }>();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      const mappedItem = mapGroupListItem(
        doc.id,
        doc.data() as GroupSource,
        actor,
      );
      if (mappedItem.isMember) mergedById.set(doc.id, mappedItem);
    });
  });

  const allItems = Array.from(mergedById.values())
    .sort((l, r) => r.updatedAt - l.updatedAt)
    .map(({ isMember: _isMember, ...item }) => item as GroupListItem);

  const start = (normalizedPage - 1) * normalizedPageSize;
  return {
    items: allItems.slice(start, start + normalizedPageSize),
    total: allItems.length,
  };
}

export async function createGroup(
  payload: CreateGroupBody,
  actor: DecodedIdToken,
): Promise<GroupListItem> {
  assertActor(actor);

  const now = Date.now();
  const actorEmail = normalizeEmail(actor.email ?? "");
  const groupRef = db.collection(GROUPS_COLLECTION).doc();
  const inviteCode = await generateUniqueInviteCode(payload.name);

  const nextGroup: GroupSource & { ownerUid: string } = {
    name: normalizeText(payload.name),
    description: normalizeText(payload.description),
    status: GROUP_STATUS.ACTIVE,
    ownerUid: actor.uid,
    ownerEmail: actorEmail,
    ownerDisplayName:
      ((actor as Record<string, unknown>)["name"] as string) ||
      ((actor as Record<string, unknown>)["displayName"] as string) ||
      "",
    memberCount: 1,
    memberUids: [actor.uid],
    memberEmails: actorEmail ? [actorEmail] : [],
    inviteCode,
    updatedAt: now,
    createdAt: now,
  };

  await groupRef.set(nextGroup);

  const { isMember: _isMember, ...item } = mapGroupListItem(
    groupRef.id,
    nextGroup,
    actor,
  );
  return item;
}

export async function getGroupByCode(
  inviteCode: string,
  actor: DecodedIdToken,
): Promise<GroupListItem & { shareLink: string; canAccessDetail: boolean }> {
  assertActor(actor);

  const normalizedCode = normalizeText(inviteCode).toUpperCase();
  const snapshot = await db
    .collection(GROUPS_COLLECTION)
    .where("inviteCode", "==", normalizedCode)
    .limit(1)
    .get();

  if (snapshot.empty) throw AppError.notFound("Group not found with this code");

  const doc = snapshot.docs[0];
  const source = (doc.data() ?? {}) as GroupSource;
  const { isMember, ...item } = mapGroupListItem(doc.id, source, actor);

  return {
    ...item,
    inviteCode: normalizedCode,
    shareLink: buildShareLink(normalizedCode),
    canAccessDetail: Boolean(isMember),
  };
}

export async function updateGroupSettings(
  groupId: string,
  payload: UpdateGroupSettingsBody,
  actor: DecodedIdToken,
): Promise<GroupListItem> {
  assertActor(actor);

  const { groupRef, source } = await getGroupOrThrow(groupId);
  assertOwner(source, actor);

  const now = Date.now();
  const nextData = { status: payload.status, updatedAt: now };

  await groupRef.set(nextData, { merge: true });

  const merged = { ...source, ...nextData };
  const { isMember: _isMember, ...item } = mapGroupListItem(
    groupId,
    merged,
    actor,
  );
  return item;
}

export async function addGroupMember(
  groupId: string,
  payload: AddGroupMemberBody,
  actor: DecodedIdToken,
): Promise<{ memberEmail: string; duplicated: boolean; group: GroupListItem }> {
  assertActor(actor);

  const { groupRef, source } = await getGroupOrThrow(groupId);
  assertOwner(source, actor);

  const nextMemberEmail = normalizeEmail(payload.email);
  const existingEmails = Array.isArray(source.memberEmails)
    ? source.memberEmails.map((email) => normalizeEmail(email)).filter(Boolean)
    : [];

  const hasMember = existingEmails.includes(nextMemberEmail);
  const mergedEmails = hasMember
    ? existingEmails
    : [...existingEmails, nextMemberEmail];

  const now = Date.now();
  const nextData = {
    memberEmails: mergedEmails,
    memberCount: mergedEmails.length || 1,
    updatedAt: now,
  };

  await groupRef.set(nextData, { merge: true });

  const { isMember: _iMember, ...group } = mapGroupListItem(
    groupId,
    { ...source, ...nextData },
    actor,
  );

  return { memberEmail: nextMemberEmail, duplicated: hasMember, group };
}

export async function getGroupShareLink(
  groupId: string,
  actor: DecodedIdToken,
): Promise<{ shareLink: string; inviteCode: string }> {
  assertActor(actor);

  const { source } = await getGroupOrThrow(groupId);
  assertMemberAccess(source, actor);

  const inviteCode = String(source.inviteCode ?? "").toUpperCase();

  return { shareLink: buildShareLink(inviteCode), inviteCode };
}

export async function resetGroupInviteCode(
  groupId: string,
  actor: DecodedIdToken,
): Promise<{ inviteCode: string; shareLink: string; updatedAt: number }> {
  assertActor(actor);

  const { groupRef, source } = await getGroupOrThrow(groupId);
  assertOwner(source, actor);

  const inviteCode = await generateUniqueInviteCode(source.name ?? "GROUP");
  const updatedAt = Date.now();

  await groupRef.set({ inviteCode, updatedAt }, { merge: true });

  return { inviteCode, shareLink: buildShareLink(inviteCode), updatedAt };
}

export async function getGroupDetail(
  groupId: string,
  actor: DecodedIdToken,
): Promise<GroupDetail> {
  assertActor(actor);

  const { source } = await getGroupOrThrow(groupId);
  assertMemberAccess(source, actor);

  const { isMember: _iMember, ...item } = mapGroupListItem(
    groupId,
    source,
    actor,
  );

  return {
    ...item,
    ownerUid: source.ownerUid ?? "",
    ownerDisplayName: source.ownerDisplayName ?? "",
    ownerEmail: source.ownerEmail ?? "",
    memberEmails: Array.isArray(source.memberEmails)
      ? source.memberEmails
          .map((email) => normalizeEmail(email))
          .filter(Boolean)
      : [],
    memberUids: Array.isArray(source.memberUids) ? source.memberUids : [],
    createdAt: toNumber(source.createdAt, 0),
    updatedAt: toNumber(source.updatedAt, 0),
    inviteCode: source.inviteCode ?? "",
    memberCount: toNumber(source.memberCount, 1),
  };
}

// ─── Join Request Functions ──────────────────────────────────────────────────

/**
 * Create a join request for a group.
 * Returns `alreadyRequested: true` if a pending request already exists.
 */
export async function requestJoinGroup(
  groupId: string,
  payload: RequestJoinGroupBody,
  actor: DecodedIdToken,
): Promise<{ requestId: string; alreadyRequested: boolean }> {
  assertActor(actor);

  const { source } = await getGroupOrThrow(groupId);

  // Already a member — no need to request
  const actorEmail = normalizeEmail(actor.email ?? "");
  const memberUids = Array.isArray(source.memberUids) ? source.memberUids : [];
  const memberEmails = Array.isArray(source.memberEmails)
    ? source.memberEmails.map((e) => normalizeEmail(e))
    : [];

  if (
    source.ownerUid === actor.uid ||
    memberUids.includes(actor.uid) ||
    memberEmails.includes(actorEmail)
  ) {
    throw AppError.badRequest("You are already a member of this group");
  }

  // Check for existing pending request
  const existingQuery = await db
    .collection(GROUPS_COLLECTION)
    .doc(groupId)
    .collection("joinRequests")
    .where("uid", "==", actor.uid)
    .where("status", "==", JOIN_REQUEST_STATUS.PENDING)
    .limit(1)
    .get();

  if (!existingQuery.empty) {
    return { requestId: existingQuery.docs[0].id, alreadyRequested: true };
  }

  const now = Date.now();
  const requestRef = db
    .collection(GROUPS_COLLECTION)
    .doc(groupId)
    .collection("joinRequests")
    .doc();

  const displayName =
    (actor as Record<string, unknown>)["name"] ??
    (actor as Record<string, unknown>)["displayName"] ??
    actor.email ??
    "";

  await requestRef.set({
    uid: actor.uid,
    email: actor.email ?? "",
    displayName: String(displayName),
    groupId,
    eventId: payload.eventId,
    status: JOIN_REQUEST_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
  });

  return { requestId: requestRef.id, alreadyRequested: false };
}

/**
 * List pending join requests for a group (owner only).
 */
export async function listJoinRequests(
  groupId: string,
  actor: DecodedIdToken,
): Promise<{ items: JoinRequestItem[] }> {
  assertActor(actor);

  const { source } = await getGroupOrThrow(groupId);
  assertOwner(source, actor);

  const snapshot = await db
    .collection(GROUPS_COLLECTION)
    .doc(groupId)
    .collection("joinRequests")
    .where("status", "==", JOIN_REQUEST_STATUS.PENDING)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const items: JoinRequestItem[] = snapshot.docs.map((doc) => {
    const d = (doc.data() ?? {}) as Record<string, unknown>;
    return {
      id: doc.id,
      groupId,
      uid: String(d["uid"] ?? ""),
      email: String(d["email"] ?? ""),
      displayName: String(d["displayName"] ?? ""),
      status:
        (d["status"] as JoinRequestItem["status"]) ??
        JOIN_REQUEST_STATUS.PENDING,
      eventId: String(d["eventId"] ?? ""),
      createdAt: toNumber(d["createdAt"], 0),
      updatedAt: toNumber(d["updatedAt"], 0),
    };
  });

  return { items };
}

/**
 * Approve a join request — adds the user to the group's `memberUids`
 * and `memberEmails`, then marks the request as approved.
 */
export async function approveJoinRequest(
  groupId: string,
  requestId: string,
  actor: DecodedIdToken,
): Promise<{ success: boolean }> {
  assertActor(actor);

  const { groupRef, source } = await getGroupOrThrow(groupId);
  assertOwner(source, actor);

  const requestRef = groupRef.collection("joinRequests").doc(requestId);
  const requestSnap = await requestRef.get();

  if (!requestSnap.exists) throw AppError.notFound("Join request not found");

  const reqData = (requestSnap.data() ?? {}) as Record<string, unknown>;

  if (reqData["status"] !== JOIN_REQUEST_STATUS.PENDING) {
    throw AppError.badRequest("This request has already been processed");
  }

  const requesterUid = String(reqData["uid"] ?? "");
  const requesterEmail = normalizeEmail(String(reqData["email"] ?? ""));
  const now = Date.now();

  const batch = db.batch();

  // Add the user to the group
  const updatePayload: Record<string, unknown> = {
    memberUids: admin.firestore.FieldValue.arrayUnion(requesterUid),
    updatedAt: now,
  };
  if (requesterEmail) {
    updatePayload["memberEmails"] =
      admin.firestore.FieldValue.arrayUnion(requesterEmail);
    updatePayload["memberCount"] = admin.firestore.FieldValue.increment(1);
  }
  batch.update(groupRef, updatePayload);

  // Mark request as approved
  batch.update(requestRef, {
    status: JOIN_REQUEST_STATUS.APPROVED,
    updatedAt: now,
  });

  await batch.commit();

  return { success: true };
}

/**
 * Reject a join request.
 */
export async function rejectJoinRequest(
  groupId: string,
  requestId: string,
  actor: DecodedIdToken,
): Promise<{ success: boolean }> {
  assertActor(actor);

  const { groupRef, source } = await getGroupOrThrow(groupId);
  assertOwner(source, actor);

  const requestRef = groupRef.collection("joinRequests").doc(requestId);
  const requestSnap = await requestRef.get();

  if (!requestSnap.exists) throw AppError.notFound("Join request not found");

  const reqData = (requestSnap.data() ?? {}) as Record<string, unknown>;

  if (reqData["status"] !== JOIN_REQUEST_STATUS.PENDING) {
    throw AppError.badRequest("This request has already been processed");
  }

  await requestRef.update({
    status: JOIN_REQUEST_STATUS.REJECTED,
    updatedAt: Date.now(),
  });

  return { success: true };
}

/**
 * Check whether a user has a pending join request for a given group.
 */
export async function hasPendingJoinRequest(
  groupId: string,
  uid: string,
): Promise<boolean> {
  const snapshot = await db
    .collection(GROUPS_COLLECTION)
    .doc(groupId)
    .collection("joinRequests")
    .where("uid", "==", uid)
    .where("status", "==", JOIN_REQUEST_STATUS.PENDING)
    .limit(1)
    .get();

  return !snapshot.empty;
}

/**
 * Check whether a given user is a member of a group.
 */
export function isGroupMember(
  source: GroupSource,
  uid: string,
  email: string,
): boolean {
  const memberUids = Array.isArray(source.memberUids) ? source.memberUids : [];
  const memberEmails = Array.isArray(source.memberEmails)
    ? source.memberEmails.map((e) => normalizeEmail(e))
    : [];
  const normalizedEmail = normalizeEmail(email);

  return (
    source.ownerUid === uid ||
    memberUids.includes(uid) ||
    memberEmails.includes(normalizedEmail)
  );
}
