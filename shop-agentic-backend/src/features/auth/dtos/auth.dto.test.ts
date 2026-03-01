import { registerSchema } from "../dtos/auth.dto";

describe("registerSchema validation", () => {
  const validPayload = {
    fullName: "Nguyen Van A",
    email: "test@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts a valid payload", () => {
    const result = registerSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects an empty fullName", () => {
    const result = registerSchema.safeParse({ ...validPayload, fullName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("fullName");
    }
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("email");
    }
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("password");
    }
  });

  it("rejects when passwords do not match", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      confirmPassword: "differentPassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });
});
