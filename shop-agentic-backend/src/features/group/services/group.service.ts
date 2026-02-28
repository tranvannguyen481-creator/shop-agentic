import admin from "@/app/config/firebaseAdmin";
import { GROUPS_COLLECTION } from "@/features/group/constants/group.constants";
import type {
  AddGroupMemberBody,
  CreateGroupBody,
  UpdateGroupSettingsBody,
} from "@/features/group/dtos/group.dto";
import {
  GROUP_STATUS,
  type GroupDetail,
  type GroupListItem,
} from "@/features/group/types/group.types";
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
