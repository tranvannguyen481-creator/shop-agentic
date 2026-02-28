import {
  GROUP_ROLE,
  GROUP_STATUS,
  type GroupListItem,
  type GroupRole,
} from "@/features/group/types/group.types";
import { normalizeEmail, toNumber } from "@/shared/utils/firestore.utils";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { GroupSource } from "./group-helpers";

export const mapGroupListItem = (
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
