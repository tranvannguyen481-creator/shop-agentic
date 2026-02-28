import admin from "@/app/config/firebaseAdmin";
import { GROUPS_COLLECTION } from "@/features/group/constants/group.constants";
import type {
  AddGroupMemberBody,
  CreateGroupBody,
  UpdateGroupSettingsBody,
} from "@/features/group/dtos/group.dto";
import {
  GROUP_ROLE,
  GROUP_STATUS,
  type GroupDetail,
  type GroupListItem,
  type GroupRole,
  type GroupStatus,
} from "@/features/group/types/group.types";
import { AppError } from "@/shared/exceptions/AppError";
import type { DecodedIdToken } from "firebase-admin/auth";

const db = admin.firestore();

// ─── Helpers ────────────────────────────────────────────────────────────────

const toNumber = (value: unknown, fallback = 0): number => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const normalizeEmail = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const makeInviteCode = (name: string): string => {
  const normalizedName = normalizeText(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 14);

  const suffix = Math.floor(Math.random() * 900 + 100).toString();
  return `${normalizedName || "GROUP"}-${suffix}`;
};

const buildShareLink = (inviteCode: string): string => {
  const clientOrigin =
    process.env.APP_CLIENT_ORIGIN ??
    process.env.FRONTEND_ORIGIN ??
    "http://localhost:3000";

  return `${clientOrigin}/group/list-my-groups?invite=${inviteCode ?? ""}`;
};

const generateUniqueInviteCode = async (name: string): Promise<string> => {
  let attempts = 0;

  while (attempts < 8) {
    const nextCode = makeInviteCode(name);
    const snapshot = await db
      .collection(GROUPS_COLLECTION)
      .where("inviteCode", "==", nextCode)
      .limit(1)
      .get();

    if (snapshot.empty) return nextCode;
    attempts += 1;
  }

  return `${makeInviteCode(name)}-${Date.now().toString().slice(-4)}`;
};

interface GroupSource {
  name?: string;
  description?: string;
  memberCount?: number;
  memberEmails?: string[];
  memberUids?: string[];
  ownerUid?: string;
  ownerEmail?: string;
  ownerDisplayName?: string;
  status?: GroupStatus;
  inviteCode?: string;
  updatedAt?: number;
  createdAt?: number;
}

const mapGroupListItem = (
  id: string,
  source: GroupSource,
  actor: DecodedIdToken | null,
): GroupListItem & { isMember: boolean } => {
  const actorUid = actor?.uid ?? "";
  const actorEmail = normalizeEmail(actor?.email ?? "");
  const memberEmails = Array.isArray(source.memberEmails)
    ? source.memberEmails.map((email) => normalizeEmail(email)).filter(Boolean)
    : [];

  const isOwner = source.ownerUid === actorUid;
  const isMember =
    isOwner ||
    memberEmails.includes(actorEmail) ||
    (Array.isArray(source.memberUids) && source.memberUids.includes(actorUid));

  return {
    id,
    name: source.name ?? "",
    description: source.description ?? "",
    memberCount: toNumber(source.memberCount, memberEmails.length || 1),
    status:
      source.status === GROUP_STATUS.PAUSED
        ? GROUP_STATUS.PAUSED
        : GROUP_STATUS.ACTIVE,
    role: (isOwner ? GROUP_ROLE.OWNER : GROUP_ROLE.MEMBER) as GroupRole,
    inviteCode: source.inviteCode ?? "",
    updatedAt: toNumber(source.updatedAt, 0),
    isMember,
  };
};

function assertActor(
  actor: DecodedIdToken | undefined,
): asserts actor is DecodedIdToken {
  if (!actor?.uid) throw AppError.unauthorized();
}

const getGroupOrThrow = async (
  groupId: string,
): Promise<{
  groupRef: FirebaseFirestore.DocumentReference;
  source: GroupSource;
}> => {
  const groupRef = db.collection(GROUPS_COLLECTION).doc(groupId);
  const snapshot = await groupRef.get();

  if (!snapshot.exists) throw AppError.notFound("Group not found");

  return { groupRef, source: (snapshot.data() ?? {}) as GroupSource };
};

const assertOwner = (source: GroupSource, actor: DecodedIdToken): void => {
  if (source.ownerUid !== actor.uid) {
    throw new AppError(
      "Only group owner can perform this action",
      403,
      "FORBIDDEN",
    );
  }
};

const assertMemberAccess = (
  source: GroupSource,
  actor: DecodedIdToken,
): void => {
  const actorEmail = normalizeEmail(actor?.email ?? "");
  const memberEmails = Array.isArray(source.memberEmails)
    ? source.memberEmails.map((email) => normalizeEmail(email))
    : [];
  const memberUids = Array.isArray(source.memberUids) ? source.memberUids : [];

  if (
    source.ownerUid !== actor.uid &&
    !memberEmails.includes(actorEmail) &&
    !memberUids.includes(actor.uid)
  ) {
    throw new AppError("You are not a member of this group", 403, "FORBIDDEN");
  }
};

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
