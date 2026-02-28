const admin = require("../../../config/firebaseAdmin");
const { USERS_COLLECTION } = require("../constants/auth.constants");

const db = admin.firestore();

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const toUserProfile = (firebaseUser, existingData = {}) => {
  const now = Date.now();
  const previousLoginCount = Number(existingData.loginCount || 0);

  return {
    uid: firebaseUser.uid,
    email: normalizeEmail(firebaseUser.email || existingData.email),
    displayName:
      firebaseUser.name ||
      firebaseUser.displayName ||
      existingData.displayName ||
      "User",
    photoURL: firebaseUser.picture || existingData.photoURL || "",
    provider: "google",
    role: existingData.role || "member",
    isVerified: true,
    loginCount: previousLoginCount + 1,
    lastLoginAt: now,
    updatedAt: now,
    createdAt: existingData.createdAt || now,
  };
};

async function verifyIdToken(idToken) {
  if (!idToken) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (caughtError) {
    const rawMessage =
      caughtError && typeof caughtError.message === "string"
        ? caughtError.message
        : "Unknown Firebase Auth verification error";

    let message = "Invalid authentication token";

    if (rawMessage.includes('incorrect "aud" claim')) {
      message =
        "Invalid authentication token: backend Firebase project does not match token audience";
    } else if (rawMessage.includes("expired")) {
      message = "Authentication token has expired";
    } else if (rawMessage.includes("Failed to determine project ID")) {
      message =
        "Backend Firebase Admin credentials are missing or invalid (cannot determine project ID)";
    }

    if (process.env.NODE_ENV !== "production") {
      message = `${message}. Detail: ${rawMessage}`;
    }

    const error = new Error(message);
    error.statusCode = 401;
    throw error;
  }
}

async function upsertUserProfile(decodedToken) {
  const userRef = db.collection(USERS_COLLECTION).doc(decodedToken.uid);
  const snapshot = await userRef.get();
  const currentData = snapshot.exists ? snapshot.data() : {};
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

async function createSession(idToken) {
  const decodedToken = await verifyIdToken(idToken);
  const profile = await upsertUserProfile(decodedToken);

  return {
    user: profile,
  };
}

async function googleAuth(idToken) {
  return createSession(idToken);
}

async function getMyProfile(decodedToken) {
  const userRef = db.collection(USERS_COLLECTION).doc(decodedToken.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    return upsertUserProfile(decodedToken);
  }

  return {
    ...snapshot.data(),
    id: decodedToken.uid,
    uid: decodedToken.uid,
  };
}

async function completeProfile(uid, payload) {
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const error = new Error("User profile not found");
    error.statusCode = 404;
    throw error;
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
    ...updated.data(),
    id: uid,
    uid,
  };
}

module.exports = {
  verifyIdToken,
  createSession,
  googleAuth,
  getMyProfile,
  completeProfile,
};
