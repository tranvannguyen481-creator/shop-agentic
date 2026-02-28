import admin from "@/app/config/firebaseAdmin";
import { USERS_COLLECTION } from "@/features/auth/constants/auth.constants";
import type {
  CompleteProfileDto,
  UpdateProfileDto,
} from "@/features/auth/dtos/auth.dto";
import type { UserProfile } from "@/features/auth/types/auth.types";
import { AppError } from "@/shared/exceptions/AppError";
import type { DecodedIdToken } from "firebase-admin/auth";

const db = admin.firestore();

const normalizeEmail = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const toUserProfile = (
  firebaseUser: DecodedIdToken,
  existingData: Partial<UserProfile> = {},
): UserProfile => {
  const now = Date.now();
  const previousLoginCount = Number(existingData.loginCount ?? 0);

  return {
    uid: firebaseUser.uid,
    email: normalizeEmail(firebaseUser.email ?? existingData.email),
    displayName:
      ((firebaseUser as Record<string, unknown>)["name"] as string) ||
      firebaseUser.name ||
      existingData.displayName ||
      "User",
    photoURL:
      ((firebaseUser as Record<string, unknown>)["picture"] as string) ||
      existingData.photoURL ||
      "",
    provider: "google",
    role: existingData.role ?? "member",
    isVerified: true,
    loginCount: previousLoginCount + 1,
    lastLoginAt: now,
    updatedAt: now,
    createdAt: existingData.createdAt ?? now,
  };
};

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  if (!idToken) {
    throw AppError.unauthorized("No authentication token provided");
  }

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (caughtError) {
    const rawMessage =
      caughtError instanceof Error
        ? caughtError.message
        : "Unknown Firebase Auth verification error";

    let message = "Invalid authentication token";

    if (rawMessage.includes('incorrect "aud" claim')) {
      message =
        "Invalid authentication token: backend Firebase project does not match token audience";
    } else if (rawMessage.includes("expired")) {
      message = "Authentication token has expired";
    } else if (rawMessage.includes("Failed to determine project ID")) {
      message = "Backend Firebase Admin credentials are missing or invalid";
    }

    if (process.env.NODE_ENV !== "production") {
      message = `${message}. Detail: ${rawMessage}`;
    }

    throw AppError.unauthorized(message);
  }
}

export async function upsertUserProfile(
  decodedToken: DecodedIdToken,
): Promise<UserProfile> {
  const userRef = db.collection(USERS_COLLECTION).doc(decodedToken.uid);
  const snapshot = await userRef.get();
  const currentData = (
    snapshot.exists ? snapshot.data() : {}
  ) as Partial<UserProfile>;
  const profile = toUserProfile(decodedToken, currentData);

  await userRef.set(
    {
      ...profile,
      id: admin.firestore.FieldValue.delete(),
      firebaseUid: admin.firestore.FieldValue.delete(),
    },
    { merge: true },
  );

  return profile;
}

export async function createSession(
  idToken: string,
): Promise<{ user: UserProfile }> {
  const decodedToken = await verifyIdToken(idToken);
  const profile = await upsertUserProfile(decodedToken);
  return { user: profile };
}

export async function googleAuth(
  idToken: string,
): Promise<{ user: UserProfile }> {
  return createSession(idToken);
}

export async function getMyProfile(
  decodedToken: DecodedIdToken,
): Promise<UserProfile & { id: string }> {
  const userRef = db.collection(USERS_COLLECTION).doc(decodedToken.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const profile = await upsertUserProfile(decodedToken);
    return { ...profile, id: decodedToken.uid };
  }

  return {
    ...(snapshot.data() as UserProfile),
    id: decodedToken.uid,
    uid: decodedToken.uid,
  };
}

export async function completeProfile(
  uid: string,
  payload: CompleteProfileDto,
): Promise<UserProfile & { id: string }> {
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    throw AppError.notFound("User profile not found");
  }

  const nextData = {
    mobileNumber: payload.mobileNumber,
    postalCode: payload.postalCode,
    onboardingCompleted: true,
    updatedAt: Date.now(),
  };

  await userRef.set(nextData, { merge: true });

  const updated = await userRef.get();
  return {
    ...(updated.data() as UserProfile),
    id: uid,
    uid,
  };
}

export async function updateProfile(
  uid: string,
  payload: UpdateProfileDto,
): Promise<UserProfile & { id: string }> {
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    throw AppError.notFound("User profile not found");
  }

  const nextData: Partial<UserProfile> & { updatedAt: number } = {
    updatedAt: Date.now(),
  };

  if (payload.displayName !== undefined) {
    nextData.displayName = payload.displayName;
  }

  if (payload.mobileNumber !== undefined) {
    nextData.mobileNumber = payload.mobileNumber;
  }

  if (payload.postalCode !== undefined) {
    nextData.postalCode = payload.postalCode;
  }

  if (payload.photoURL !== undefined) {
    nextData.photoURL = payload.photoURL;
  }

  await userRef.set(nextData, { merge: true });

  return {
    ...(snapshot.data() as UserProfile),
    ...nextData,
    id: uid,
    uid,
  };
}
