const {
  completeProfileSchema,
  googleLoginSchema,
  sessionSchema,
} = require("../dtos/auth.dto");
const {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
} = require("../constants/auth.constants");
const authService = require("../services/auth.service");

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
  path: "/",
};

const clearAuthCookieOptions = {
  ...authCookieOptions,
  maxAge: undefined,
};

async function createSession(req, res) {
  const parsedBody = sessionSchema.parse(req.body || {});
  const result = await authService.createSession(parsedBody.idToken);

  res.cookie(AUTH_COOKIE_NAME, parsedBody.idToken, authCookieOptions);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function googleLogin(req, res) {
  const parsedBody = googleLoginSchema.parse(req.body || {});
  const result = await authService.googleAuth(parsedBody.idToken);

  res.cookie(AUTH_COOKIE_NAME, parsedBody.idToken, authCookieOptions);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Login successful",
  });
}

async function getMyProfile(req, res) {
  const decodedToken = req.user;

  if (!decodedToken?.uid) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const profile = await authService.getMyProfile(decodedToken);

  return res.status(200).json({
    success: true,
    data: { user: profile },
    message: "Success",
  });
}

async function signOut(_req, res) {
  res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);

  return res.status(200).json({
    success: true,
    data: null,
    message: "Success",
  });
}

async function completeProfile(req, res) {
  const parsedBody = completeProfileSchema.parse(req.body || {});
  const uid = req.user?.uid;

  if (!uid) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const updatedUser = await authService.completeProfile(uid, parsedBody);

  return res.status(200).json({
    success: true,
    data: {
      user: updatedUser,
    },
    message: "Profile completed",
  });
}

module.exports = {
  createSession,
  googleLogin,
  getMyProfile,
  completeProfile,
  signOut,
};
