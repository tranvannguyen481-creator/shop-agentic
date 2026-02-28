#!/usr/bin/env node
/**
 * error hook — chạy khi Agent gặp lỗi
 * - Ghi lỗi vào .github/hooks/logs/error.log
 * - In thông báo rõ ràng ra console
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.resolve(__dirname, "../logs");
const LOG_FILE = path.join(LOG_DIR, "error.log");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB — rotate khi đầy

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function rotateIfNeeded() {
  if (fs.existsSync(LOG_FILE)) {
    const size = fs.statSync(LOG_FILE).size;
    if (size > MAX_LOG_SIZE_BYTES) {
      fs.renameSync(LOG_FILE, LOG_FILE.replace(".log", `-${Date.now()}.log`));
    }
  }
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let context = {};
  try {
    context = JSON.parse(input);
  } catch {
    context = { raw: input };
  }

  const timestamp = new Date().toISOString();
  const errorMsg = context.error || context.message || "Unknown error";
  const tool = context.tool || context.toolName || "unknown tool";
  const params = JSON.stringify(context.parameters || context.input || {});

  const logEntry = [
    `[${timestamp}]`,
    `TOOL: ${tool}`,
    `ERROR: ${errorMsg}`,
    `PARAMS: ${params}`,
    "─".repeat(80),
    "",
  ].join("\n");

  // ── Ghi log file ───────────────────────────────────────────────────────
  try {
    ensureLogDir();
    rotateIfNeeded();
    fs.appendFileSync(LOG_FILE, logEntry, "utf8");
    console.error(
      "[ERROR HOOK] Lỗi đã được ghi vào: .github/hooks/logs/error.log",
    );
  } catch (writeErr) {
    console.error("[ERROR HOOK] Không thể ghi log file:", writeErr.message);
  }

  // ── In chi tiết ra console ─────────────────────────────────────────────
  console.error("");
  console.error("╔══════════════════════════════════════════════════════════╗");
  console.error("║              ⚠  SHOP-AGENTIC — LỖI AGENT               ║");
  console.error("╚══════════════════════════════════════════════════════════╝");
  console.error(`  Thời gian : ${timestamp}`);
  console.error(`  Tool      : ${tool}`);
  console.error(`  Lỗi       : ${errorMsg}`);

  // ── Gợi ý khắc phục dựa trên pattern lỗi ─────────────────────────────
  const suggestions = [];

  if (/ENOENT|no such file/i.test(errorMsg)) {
    suggestions.push("File không tồn tại — kiểm tra lại đường dẫn.");
  }
  if (/permission denied/i.test(errorMsg)) {
    suggestions.push("Không có quyền — kiểm tra file permissions.");
  }
  if (/tsc|typescript|type error/i.test(errorMsg)) {
    suggestions.push(
      "Lỗi TypeScript — chạy: cd shop-agentic-backend && npx tsc --noEmit",
    );
  }
  if (/eslint/i.test(errorMsg)) {
    suggestions.push("Lỗi ESLint — chạy: npx eslint src/ --fix");
  }
  if (/firestore|firebase/i.test(errorMsg)) {
    suggestions.push(
      "Lỗi Firebase — kiểm tra kết nối và service account credentials.",
    );
  }
  if (/eaddrinuse/i.test(errorMsg)) {
    suggestions.push("Port đã bị chiếm — chạy: npx kill-port <port>");
  }

  if (suggestions.length > 0) {
    console.error("");
    console.error("  Gợi ý:");
    suggestions.forEach((s, i) => console.error(`    ${i + 1}. ${s}`));
  }

  console.error("");
  process.exit(0); // error hook không block — chỉ log
});
