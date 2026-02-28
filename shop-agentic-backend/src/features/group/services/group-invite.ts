import admin from "@/app/config/firebaseAdmin";
import { GROUPS_COLLECTION } from "@/features/group/constants/group.constants";
import { normalizeText } from "@/shared/utils/firestore.utils";

const db = admin.firestore();

export const makeInviteCode = (name: string): string => {
  const normalizedName = normalizeText(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 14);

  const suffix = Math.floor(Math.random() * 900 + 100).toString();
  return `${normalizedName || "GROUP"}-${suffix}`;
};

export const buildShareLink = (inviteCode: string): string => {
  const clientOrigin =
    process.env.APP_CLIENT_ORIGIN ??
    process.env.FRONTEND_ORIGIN ??
    "http://localhost:3000";

  return `${clientOrigin}/group/list-my-groups?invite=${inviteCode ?? ""}`;
};

export const generateUniqueInviteCode = async (
  name: string,
): Promise<string> => {
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
