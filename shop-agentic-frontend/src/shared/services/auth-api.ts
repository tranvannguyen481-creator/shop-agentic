import { isAxiosError } from "axios";
import firebase from "firebase/compat/app";
import api from "./api";
import { auth } from "./firebase";

export interface AuthUser {
  id: string;
  uid?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  isPremium?: boolean;
  [key: string]: unknown;
}

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const response = await api.get("/auth/me");
    const user = response.data?.data?.user as AuthUser | undefined;
    return user ?? null;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
};

export const signInWithEmailAndPin = async (
  email: string,
  pin: string,
): Promise<AuthUser> => {
  const credential = await auth.signInWithEmailAndPassword(email, pin);
  const idToken = await credential.user?.getIdToken(true);

  if (!idToken) {
    throw new Error("Unable to retrieve idToken");
  }

  const response = await api.post("/auth/session", { idToken });
  const user = response.data?.data?.user as AuthUser | undefined;

  if (!user) {
    throw new Error("Missing user profile");
  }

  return user;
};

const authenticateWithGoogle = async (): Promise<AuthUser> => {
  const provider = new firebase.auth.GoogleAuthProvider();
  const credential = await auth.signInWithPopup(provider);
  const idToken = await credential.user?.getIdToken(true);

  if (!idToken) {
    throw new Error("Unable to retrieve idToken");
  }

  const response = await api.post("/auth/google", { idToken });
  const user = response.data?.data?.user as AuthUser | undefined;

  if (!user) {
    throw new Error("Missing user profile");
  }

  return user;
};

export const signInWithGoogle = async (): Promise<AuthUser> =>
  authenticateWithGoogle();

export const signUpWithGoogle = async (): Promise<AuthUser> =>
  authenticateWithGoogle();

export const signOutSession = async (): Promise<void> => {
  try {
    await api.post("/auth/signout");
  } catch {
    // no-op
  }

  try {
    await auth.signOut();
  } catch {
    // no-op
  }
};

export interface UpdateProfilePayload {
  displayName?: string;
  mobileNumber?: string;
  postalCode?: string;
}

export const updateUserProfile = async (
  payload: UpdateProfilePayload,
): Promise<AuthUser> => {
  const response = await api.put("/auth/update-profile", payload);
  const user = response.data?.data?.user as AuthUser | undefined;

  if (!user) {
    throw new Error("Missing user profile in response");
  }

  return user;
};
