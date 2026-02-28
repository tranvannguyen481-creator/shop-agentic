const admin = require("../../../config/firebaseAdmin");
const { GROUPS_COLLECTION } = require("../constants/group.constants");
const { GROUP_ROLE, GROUP_STATUS } = require("../types/group.types");

const db = admin.firestore();

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const makeInviteCode = (name) => {
  const normalizedName = normalizeText(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 14);

  const suffix = Math.floor(Math.random() * 900 + 100).toString();
  return `${normalizedName || "GROUP"}-${suffix}`;
};

const buildShareLink = (inviteCode) => {
  const clientOrigin =
    process.env.APP_CLIENT_ORIGIN ||
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:3000";

  return `${clientOrigin}/group/list-my-groups?invite=${inviteCode || ""}`;
};

const generateUniqueInviteCode = async (name) => {
  let attempts = 0;

  while (attempts < 8) {
    const nextCode = makeInviteCode(name);
    const snapshot = await db
      .collection(GROUPS_COLLECTION)
      .where("inviteCode", "==", nextCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return nextCode;
    }

    attempts += 1;
  }

  return `${makeInviteCode(name)}-${Date.now().toString().slice(-4)}`;
};

const mapGroupListItem = (id, source = {}, actor = null) => {
  const actorUid = actor?.uid || "";
  const actorEmail = normalizeEmail(actor?.email || "");
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
    name: source.name || "",
    description: source.description || "",
    memberCount: toNumber(source.memberCount, memberEmails.length || 1),
    status:
      source.status === GROUP_STATUS.PAUSED
        ? GROUP_STATUS.PAUSED
        : GROUP_STATUS.ACTIVE,
    role: isOwner ? GROUP_ROLE.OWNER : GROUP_ROLE.MEMBER,
    inviteCode: source.inviteCode || "",
    updatedAt: toNumber(source.updatedAt, 0),
    isMember,
  };
};

const assertActor = (actor) => {
  if (!actor?.uid) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
};

const getGroupOrThrow = async (groupId) => {
  const groupRef = db.collection(GROUPS_COLLECTION).doc(groupId);
  const snapshot = await groupRef.get();

  if (!snapshot.exists) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    groupRef,
    source: snapshot.data() || {},
  };
};

const assertOwner = (source, actor) => {
  if (source.ownerUid !== actor.uid) {
    const error = new Error("Only group owner can perform this action");
    error.statusCode = 403;
    throw error;
  }
};

const assertMemberAccess = (source, actor) => {
  const actorEmail = normalizeEmail(actor?.email || "");
  const memberEmails = Array.isArray(source.memberEmails)
    ? source.memberEmails.map((email) => normalizeEmail(email))
    : [];
  const memberUids = Array.isArray(source.memberUids) ? source.memberUids : [];

  if (
    source.ownerUid !== actor.uid &&
    !memberEmails.includes(actorEmail) &&
    !memberUids.includes(actor.uid)
  ) {
    const error = new Error("You are not a member of this group");
    error.statusCode = 403;
    throw error;
  }
};

async function listMyGroups(actor, { page = 1, pageSize = 20 } = {}) {
  assertActor(actor);

  const actorUid = actor.uid;
  const actorEmail = normalizeEmail(actor.email || "");
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
  const mergedById = new Map();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      const mappedItem = mapGroupListItem(doc.id, doc.data() || {}, actor);
      if (mappedItem.isMember) {
        mergedById.set(doc.id, mappedItem);
      }
    });
  });

  const allItems = Array.from(mergedById.values())
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .map(({ isMember, ...item }) => item);

  const start = (normalizedPage - 1) * normalizedPageSize;

  return {
    items: allItems.slice(start, start + normalizedPageSize),
    total: allItems.length,
  };
}

async function createGroup(payload, actor) {
  assertActor(actor);

  const now = Date.now();
  const actorEmail = normalizeEmail(actor.email || "");
  const groupRef = db.collection(GROUPS_COLLECTION).doc();

  const inviteCode = await generateUniqueInviteCode(payload.name);

  const nextGroup = {
    name: normalizeText(payload.name),
    description: normalizeText(payload.description),
    status: GROUP_STATUS.ACTIVE,
    ownerUid: actor.uid,
    ownerEmail: actorEmail,
    ownerDisplayName: actor.name || actor.displayName || "",
    memberCount: 1,
    memberUids: [actor.uid],
    memberEmails: actorEmail ? [actorEmail] : [],
    inviteCode,
    createdAt: now,
    updatedAt: now,
  };

  await groupRef.set(nextGroup);

  const { isMember, ...item } = mapGroupListItem(groupRef.id, nextGroup, actor);
  return item;
}

async function getGroupByCode(inviteCode, actor) {
  assertActor(actor);

  const normalizedCode = normalizeText(inviteCode).toUpperCase();
  const snapshot = await db
    .collection(GROUPS_COLLECTION)
    .where("inviteCode", "==", normalizedCode)
    .limit(1)
    .get();

  if (snapshot.empty) {
    const error = new Error("Group not found with this code");
    error.statusCode = 404;
    throw error;
  }

  const doc = snapshot.docs[0];
  const source = doc.data() || {};
  const mapped = mapGroupListItem(doc.id, source, actor);
  const { isMember, ...item } = mapped;

  return {
    ...item,
    inviteCode: normalizedCode,
    shareLink: buildShareLink(normalizedCode),
    canAccessDetail: Boolean(isMember),
  };
}

async function updateGroupSettings(groupId, payload, actor) {
  assertActor(actor);

  const { groupRef, source } = await getGroupOrThrow(groupId);
  assertOwner(source, actor);

  const now = Date.now();
  const nextData = {
    status: payload.status,
    updatedAt: now,
  };

  await groupRef.set(nextData, { merge: true });

  const merged = {
    ...source,
    ...nextData,
  };

  const { isMember, ...item } = mapGroupListItem(groupId, merged, actor);
  return item;
}

async function addGroupMember(groupId, payload, actor) {
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

  return {
    memberEmail: nextMemberEmail,
    duplicated: hasMember,
    group: {
      ...mapGroupListItem(
        groupId,
        {
          ...source,
          ...nextData,
        },
        actor,
      ),
    },
  };
}

async function getGroupShareLink(groupId, actor) {
  assertActor(actor);

  const { source } = await getGroupOrThrow(groupId);
  assertMemberAccess(source, actor);

  const inviteCode = String(source.inviteCode || "").toUpperCase();

  return {
    shareLink: buildShareLink(inviteCode),
    inviteCode,
  };
}

async function resetGroupInviteCode(groupId, actor) {
  assertActor(actor);

  const { groupRef, source } = await getGroupOrThrow(groupId);
  assertOwner(source, actor);

  const inviteCode = await generateUniqueInviteCode(source.name || "GROUP");
  const updatedAt = Date.now();

  await groupRef.set(
    {
      inviteCode,
      updatedAt,
    },
    { merge: true },
  );

  return {
    inviteCode,
    shareLink: buildShareLink(inviteCode),
    updatedAt,
  };
}

async function getGroupDetail(groupId, actor) {
  assertActor(actor);

  const { source } = await getGroupOrThrow(groupId);
  assertMemberAccess(source, actor);

  const mapped = mapGroupListItem(groupId, source, actor);
  const { isMember, ...item } = mapped;

  return {
    ...item,
    ownerUid: source.ownerUid || "",
    ownerDisplayName: source.ownerDisplayName || "",
    ownerEmail: source.ownerEmail || "",
    memberEmails: Array.isArray(source.memberEmails)
      ? source.memberEmails
          .map((email) => normalizeEmail(email))
          .filter(Boolean)
      : [],
    memberUids: Array.isArray(source.memberUids) ? source.memberUids : [],
    createdAt: toNumber(source.createdAt, 0),
    updatedAt: toNumber(source.updatedAt, 0),
    inviteCode: source.inviteCode || "",
    memberCount: toNumber(source.memberCount, 1),
  };
}

module.exports = {
  listMyGroups,
  getGroupByCode,
  createGroup,
  updateGroupSettings,
  addGroupMember,
  getGroupShareLink,
  resetGroupInviteCode,
  getGroupDetail,
};
