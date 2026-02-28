import { z } from "zod";

export const signUpProfileSchema = z.object({
  mobileNumber: z
    .string()
    .min(8, "Mobile number must be at least 8 digits")
    .max(20, "Mobile number is too long"),
  postalCode: z
    .string()
    .min(3, "Postal code must be at least 3 characters")
    .max(12, "Postal code is too long"),
});
