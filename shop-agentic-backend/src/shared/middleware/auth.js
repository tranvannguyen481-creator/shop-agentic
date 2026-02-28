const authService = require("../../features/auth/services/auth.service");
const {
  AUTH_COOKIE_NAME,
} = require("../../features/auth/constants/auth.constants");

const getCookieValue = (cookieHeader, cookieName) => {
  if (!cookieHeader || typeof cookieHeader !== "string") {
    return "";
  }

  const targetPrefix = `${cookieName}=`;
  const cookieEntry = cookieHeader
    .split(";")
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith(targetPrefix));

  if (!cookieEntry) {
    return "";
  }

  return decodeURIComponent(cookieEntry.slice(targetPrefix.length));
};

module.exports = async function authMiddleware(req, _res, next) {
  const cookieToken = getCookieValue(req.headers.cookie, AUTH_COOKIE_NAME);
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";
  const idToken = cookieToken || bearerToken;

  req.user = await authService.verifyIdToken(idToken);
  next();
};
