import admin from "@/app/config/firebaseAdmin";
import { GROUPS_COLLECTION } from "@/features/event/constants/event.constants";
import { AppError } from "@/shared/exceptions/AppError";
import {
  normalizeEmail,
  toNumber,
  toPriceNumber,
} from "@/shared/utils/firestore.utils";
import type { DecodedIdToken } from "firebase-admin/auth";

const db = admin.firestore();

export { toNumber, toPriceNumber };

export const toYearMonth = (
  closingDate: unknown,
  fallbackTimestamp: number,
): string => {
  const parsedDate = new Date(closingDate as string | number);

  if (Number.isNaN(parsedDate.getTime())) {
    const fallbackDate = new Date(fallbackTimestamp);
    const year = fallbackDate.getUTCFullYear();
    const month = String(fallbackDate.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const resolveGroupId = (data: Record<string, unknown> = {}): string => {
  const createEventDraft = (data["createEventDraft"] ?? data) as Record<
    string,
    unknown
  >;

  const fromDraft =
    typeof createEventDraft["groupId"] === "string"
      ? createEventDraft["groupId"].trim()
      : "";
  const fromRoot =
    typeof data["groupId"] === "string" ? data["groupId"].trim() : "";

  return fromDraft || fromRoot;
};

export async function getGroupForCreate(
  groupId: string,
  actor: DecodedIdToken,
): Promise<Record<string, unknown> & { id: string }> {
  const groupSnapshot = await db
    .collection(GROUPS_COLLECTION)
    .doc(groupId)
    .get();

  if (!groupSnapshot.exists)
    throw AppError.notFound("Selected group not found");

  const group = (groupSnapshot.data() ?? {}) as Record<string, unknown>;
  const actorEmail = normalizeEmail(actor?.email ?? "");
  const memberEmails = Array.isArray(group["memberEmails"])
    ? (group["memberEmails"] as string[])
        .map((email) => normalizeEmail(email))
        .filter(Boolean)
    : [];
  const memberUids = Array.isArray(group["memberUids"])
    ? (group["memberUids"] as string[])
    : [];

  const canCreate =
    group["ownerUid"] === actor.uid ||
    memberUids.includes(actor.uid) ||
    (actorEmail && memberEmails.includes(actorEmail));

  if (!canCreate) {
    throw new AppError(
      "You are not allowed to create event in this group",
      403,
      "FORBIDDEN",
    );
  }

  return { id: groupSnapshot.id, ...group };
}
