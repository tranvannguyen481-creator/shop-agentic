const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "shop-agentic";
const workspaceRoot = path.resolve(__dirname, "../../");
const defaultServiceAccountPath = path.resolve(
  workspaceRoot,
  "service-account-key.json",
);
const legacyServiceAccountPath = path.resolve(
  __dirname,
  "../serviceAccount.json",
);

const findAutoServiceAccountPath = () => {
  try {
    const candidates = fs
      .readdirSync(workspaceRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .filter(
        (name) =>
          name.includes("firebase-adminsdk") ||
          name.includes("service-account") ||
          name.includes("serviceAccount"),
      );

    if (candidates.length === 0) {
      return null;
    }

    return path.resolve(workspaceRoot, candidates[0]);
  } catch {
    return null;
  }
};

const getServiceAccountFromJsonEnv = () => {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw || !raw.trim()) {
    return null;
  }

  if (!raw.trim().startsWith("{")) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const resolveServiceAccountPath = () => {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (configuredPath && !configuredPath.trim().startsWith("{")) {
    const absoluteConfiguredPath = path.resolve(workspaceRoot, configuredPath);
    if (fs.existsSync(absoluteConfiguredPath)) {
      return absoluteConfiguredPath;
    }

    const error = new Error(
      `FIREBASE_SERVICE_ACCOUNT_KEY points to missing file: ${absoluteConfiguredPath}`,
    );
    error.statusCode = 500;
    throw error;
  }

  if (fs.existsSync(defaultServiceAccountPath)) {
    return defaultServiceAccountPath;
  }

  if (fs.existsSync(legacyServiceAccountPath)) {
    return legacyServiceAccountPath;
  }

  const autoDetectedPath = findAutoServiceAccountPath();
  if (autoDetectedPath && fs.existsSync(autoDetectedPath)) {
    return autoDetectedPath;
  }

  return null;
};

if (!admin.apps.length) {
  const envServiceAccount = getServiceAccountFromJsonEnv();

  if (envServiceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(envServiceAccount),
      projectId: firebaseProjectId,
    });
  } else {
    const resolvedPath = resolveServiceAccountPath();

    if (!resolvedPath) {
      throw new Error(
        "Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_KEY as JSON content or as a path (e.g. ./service-account-key.json), or place a *firebase-adminsdk*.json file in backend root.",
      );
    }

    const serviceAccount = require(resolvedPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: firebaseProjectId,
    });
  }
}

module.exports = admin;
