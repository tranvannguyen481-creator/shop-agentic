const { z } = require("zod");

const sessionSchema = z.object({
  idToken: z.string().min(20, "Invalid ID Token"),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(20, "Invalid ID Token"),
});

const completeProfileSchema = z.object({
  mobileNumber: z.string().min(8, "Mobile number must be at least 8 digits"),
  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
});

module.exports = {
  sessionSchema,
  googleLoginSchema,
  completeProfileSchema,
};
