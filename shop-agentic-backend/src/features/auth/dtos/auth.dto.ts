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

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name is too long")
    .optional(),
  mobileNumber: z
    .string()
    .min(8, "Mobile number must be at least 8 digits")
    .max(20, "Mobile number is too long")
    .optional(),
  postalCode: z
    .string()
    .min(3, "Postal code must be at least 3 characters")
    .max(12, "Postal code is too long")
    .optional(),
});

export type SessionDto = z.infer<typeof sessionSchema>;
export type GoogleLoginDto = z.infer<typeof googleLoginSchema>;
export type CompleteProfileDto = z.infer<typeof completeProfileSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
