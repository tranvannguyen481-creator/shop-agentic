export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  provider: string;
  role: "member" | "admin";
  isVerified: boolean;
  loginCount: number;
  lastLoginAt: number;
  updatedAt: number;
  createdAt: number;
  mobileNumber?: string;
  postalCode?: string;
  onboardingCompleted?: boolean;
}
