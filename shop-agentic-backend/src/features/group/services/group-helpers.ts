import admin from "@/app/config/firebaseAdmin";
import { GROUPS_COLLECTION } from "@/features/group/constants/group.constants";
import type { GroupStatus } from "@/features/group/types/group.types";
import { AppError } from "@/shared/exceptions/AppError";
import { normalizeEmail } from "@/shared/utils/firestore.utils";
import type { DecodedIdToken } from "firebase-admin/auth";

const db = admin.firestore();

export interface GroupSource {
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

export const getGroupOrThrow = async (
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

export const assertOwner = (
  source: GroupSource,
  actor: DecodedIdToken,
): void => {
  if (source.ownerUid !== actor.uid) {
    throw new AppError(
      "Only group owner can perform this action",
      403,
      "FORBIDDEN",
    );
  }
};

export const assertMemberAccess = (
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
