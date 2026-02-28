#!/usr/bin/env node
/**
 * sessionEnd hook — chạy khi kết thúc session Agent
 * - Liệt kê file đã thay đổi trong session
 * - Gợi ý commit message chuẩn Conventional Commits
 * - Ghi session summary vào .github/hooks/logs/session-YYYY-MM-DD.log
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");
const LOG_DIR = path.resolve(__dirname, "../logs");

function exec(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function inferCommitType(files) {
  const paths = files.join(" ").toLowerCase();
  if (paths.includes("test") || paths.includes("spec")) return "test";
  if (paths.includes(".github")) return "chore";
  if (
    paths.includes("routes") ||
    paths.includes("controllers") ||
    paths.includes("services")
  )
    return "feat";
  if (paths.includes("fix") || paths.includes("bug")) return "fix";
  if (paths.includes("types") || paths.includes("dtos")) return "refactor";
  if (paths.includes("styles") || paths.includes("scss")) return "style";
  if (paths.includes("readme") || paths.includes(".md")) return "docs";
  return "feat";
}

function inferScope(files) {
  const MODULES = [
    "auth",
    "event",
    "group",
    "order",
    "notification",
    "upload",
    "test",
  ];
  for (const mod of MODULES) {
    if (files.some((f) => f.includes(`/${mod}/`) || f.includes(`\\${mod}\\`))) {
      return mod;
    }
  }
  if (files.some((f) => f.includes("shared"))) return "shared";
  if (files.some((f) => f.includes("frontend"))) return "frontend";
  if (files.some((f) => f.includes("backend"))) return "backend";
  return "app";
}

function main() {
  const timestamp = new Date().toISOString();
  const today = timestamp.slice(0, 10);

  console.log("=== [SHOP-AGENTIC] Session End Hook ===");

  // ── 1. File thay đổi (chưa staged + staged) ───────────────────────────
  const stagedRaw = exec("git diff --cached --name-only");
  const unstagedRaw = exec("git diff --name-only");
  const untrackedRaw = exec("git ls-files --others --exclude-standard");

  const staged = stagedRaw.split("\n").filter(Boolean);
  const unstaged = unstagedRaw.split("\n").filter(Boolean);
  const untracked = untrackedRaw.split("\n").filter(Boolean);
  const allChanged = [...new Set([...staged, ...unstaged, ...untracked])];

  if (allChanged.length === 0) {
    console.log("[INFO] Không có file nào thay đổi trong session này.");
    process.exit(0);
  }

  console.log(`[INFO] Tổng cộng ${allChanged.length} file thay đổi:`);
  allChanged.slice(0, 20).forEach((f) => console.log(`  + ${f}`));
  if (allChanged.length > 20) {
    console.log(`  ... và ${allChanged.length - 20} file khác`);
  }

  // ── 2. Gợi ý commit message ────────────────────────────────────────────
  const type = inferCommitType(allChanged);
  const scope = inferScope(allChanged);

  const backendFiles = allChanged.filter((f) => f.includes("backend")).length;
  const frontendFiles = allChanged.filter((f) => f.includes("frontend")).length;

  let description = "update";
  if (backendFiles > 0 && frontendFiles > 0) {
    description = `full-stack changes in ${scope}`;
  } else if (backendFiles > 0) {
    description = `backend changes in ${scope}`;
  } else if (frontendFiles > 0) {
    description = `frontend changes in ${scope}`;
  }

  const suggestedCommit = `${type}(${scope}): ${description}`;

  console.log("");
  console.log("[SUGGEST] Commit message gợi ý:");
  console.log(`  ${suggestedCommit}`);
  console.log("");
  console.log("[SUGGEST] Lệnh commit:");
  console.log(`  git add -A && git commit -m "${suggestedCommit}"`);

  // ── 3. Ghi session log ────────────────────────────────────────────────
  const logFile = path.join(LOG_DIR, `session-${today}.log`);
  const logEntry = [
    `[${timestamp}] SESSION END`,
    `Files changed (${allChanged.length}):`,
    allChanged.map((f) => `  - ${f}`).join("\n"),
    "",
    `Suggested commit: ${suggestedCommit}`,
    "═".repeat(80),
    "",
  ].join("\n");

  try {
    ensureLogDir();
    fs.appendFileSync(logFile, logEntry, "utf8");
    console.log(
      `[INFO] Session log đã được lưu: .github/hooks/logs/session-${today}.log`,
    );
  } catch (err) {
    console.warn("[WARN] Không thể ghi session log:", err.message);
  }

  console.log("=== Session End Hook hoàn thành ===");
  process.exit(0);
}

main();
