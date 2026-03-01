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
}
