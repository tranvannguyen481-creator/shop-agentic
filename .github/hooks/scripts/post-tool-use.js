#!/usr/bin/env node
/**
 * postToolUse hook — chạy SAU khi tool hoàn thành
 * - Nếu file TypeScript/TSX vừa được thay đổi → chạy ESLint
 * - Nếu là backend file → chạy tsc --noEmit kiểm tra type errors
 *
 * Exit 0  → bình thường
 * Exit non-zero → hook thất bại (ghi log, không block agent)
 */

const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");
const BACKEND_DIR = path.join(ROOT, "shop-agentic-backend");
const FRONTEND_DIR = path.join(ROOT, "shop-agentic-frontend");

function exec(cmd, cwd) {
  try {
    const output = execSync(cmd, {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { ok: true, output: output.trim() };
  } catch (err) {
    return { ok: false, output: (err.stdout || "") + (err.stderr || "") };
  }
}

function getProjectDir(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.includes("shop-agentic-backend")) return BACKEND_DIR;
  if (normalized.includes("shop-agentic-frontend")) return FRONTEND_DIR;
  return null;
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let context = {};
  try {
    context = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const tool = context.tool || context.toolName || "";
  const params = context.parameters || context.input || {};

  const FILE_EDIT_TOOLS = [
    "create_file",
    "replace_string_in_file",
    "multi_replace_string_in_file",
    "edit_notebook_file",
    "write_file",
  ];

  if (
    !FILE_EDIT_TOOLS.some((t) => tool.toLowerCase().includes(t.toLowerCase()))
  ) {
    process.exit(0);
  }

  const filePath = params.filePath || params.path || params.file || "";
  if (!filePath) process.exit(0);

  const isTS = /\.(ts|tsx)$/.test(filePath);
  if (!isTS) process.exit(0);

  const projectDir = getProjectDir(filePath);
  if (!projectDir) process.exit(0);

  console.log(`[POST] File vừa thay đổi: ${path.relative(ROOT, filePath)}`);

  // ── Chạy ESLint ────────────────────────────────────────────────────────
  console.log("[POST] Đang chạy ESLint...");
  const lintResult = exec(
    `npx eslint --max-warnings=0 "${filePath}"`,
    projectDir,
  );

  if (lintResult.ok) {
    console.log("[POST] ESLint: PASSED ✓");
  } else {
    console.warn("[POST] ESLint: có warnings/errors:");
    console.warn(lintResult.output.split("\n").slice(0, 20).join("\n"));
  }

  // ── Chạy tsc --noEmit (chỉ cho backend — frontend dùng Vite) ──────────
  if (projectDir === BACKEND_DIR) {
    console.log("[POST] Đang kiểm tra TypeScript types (tsc --noEmit)...");
    const tscResult = exec("npx tsc --noEmit", projectDir);
    if (tscResult.ok) {
      console.log("[POST] TypeScript: PASSED ✓");
    } else {
      const errors = tscResult.output
        .split("\n")
        .filter((l) => l.includes("error TS"));
      console.warn(`[POST] TypeScript: ${errors.length} lỗi type:`);
      errors.slice(0, 10).forEach((e) => console.warn(`  ${e}`));
    }
  }

  process.exit(0);
});
