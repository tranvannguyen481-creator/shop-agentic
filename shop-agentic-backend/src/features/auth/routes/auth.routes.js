const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../../../shared/middleware/auth");

const router = express.Router();

const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/session", authController.createSession);
router.post("/google", googleAuthLimiter, authController.googleLogin);
router.get("/me", authMiddleware, authController.getMyProfile);
router.post(
  "/complete-profile",
  authMiddleware,
  authController.completeProfile,
);
router.post("/signout", authController.signOut);

module.exports = router;
