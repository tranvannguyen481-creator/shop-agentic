import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID ?? "shop-agentic";
const workspaceRoot = path.resolve(__dirname, "../../../");
const defaultServiceAccountPath = path.resolve(
  workspaceRoot,
  "service-account-key.json",
);
const legacyServiceAccountPath = path.resolve(
  __dirname,
  "../../serviceAccount.json",
);

const findAutoServiceAccountPath = (): string | null => {
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

    if (candidates.length === 0) return null;
    return path.resolve(workspaceRoot, candidates[0]);
  } catch {
    return null;
  }
};

const getServiceAccountFromJsonEnv = (): admin.ServiceAccount | null => {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ??
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw?.trim()) return null;
  if (!raw.trim().startsWith("{")) return null;

  try {
    return JSON.parse(raw) as admin.ServiceAccount;
  } catch {
    return null;
  }
};

const resolveServiceAccountPath = (): string | null => {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (configuredPath && !configuredPath.trim().startsWith("{")) {
    const absoluteConfiguredPath = path.resolve(workspaceRoot, configuredPath);
    if (fs.existsSync(absoluteConfiguredPath)) return absoluteConfiguredPath;

    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_KEY points to missing file: ${absoluteConfiguredPath}`,
    );
  }

  if (fs.existsSync(defaultServiceAccountPath))
    return defaultServiceAccountPath;
  if (fs.existsSync(legacyServiceAccountPath)) return legacyServiceAccountPath;

  const autoDetectedPath = findAutoServiceAccountPath();
  if (autoDetectedPath && fs.existsSync(autoDetectedPath))
    return autoDetectedPath;

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

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(resolvedPath) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: firebaseProjectId,
    });
  }
}

export default admin;
