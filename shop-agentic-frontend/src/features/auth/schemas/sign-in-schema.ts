import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Email address is invalid"),
  pin: z.string().min(4, "PIN must be at least 4 characters"),
});
