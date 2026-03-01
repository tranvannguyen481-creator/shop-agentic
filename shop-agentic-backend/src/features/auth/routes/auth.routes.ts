import * as authController from "@/features/auth/controllers/auth.controller";
import authMiddleware from "@/shared/middleware/auth";
import { Router } from "express";
import rateLimit from "express-rate-limit";

const router = Router();

const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/session", authController.createSession);
router.post("/google", googleAuthLimiter, authController.googleLogin);
router.post("/register", authController.register);
router.get("/me", authMiddleware, authController.getMyProfile);
router.post(
  "/complete-profile",
  authMiddleware,
  authController.completeProfile,
);
router.put(
  "/update-profile",
  authMiddleware,
  authController.updateProfile,
);
router.post("/signout", authController.signOut);

export default router;
