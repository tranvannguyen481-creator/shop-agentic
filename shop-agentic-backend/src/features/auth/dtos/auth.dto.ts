import { z } from "zod";

export const sessionSchema = z.object({
  idToken: z.string().min(20, "Invalid ID Token"),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(20, "Invalid ID Token"),
});

export const completeProfileSchema = z.object({
  mobileNumber: z.string().min(8, "Mobile number must be at least 8 digits"),
  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
});

export type SessionDto = z.infer<typeof sessionSchema>;
export type GoogleLoginDto = z.infer<typeof googleLoginSchema>;
export type CompleteProfileDto = z.infer<typeof completeProfileSchema>;
