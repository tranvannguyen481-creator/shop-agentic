#!/usr/bin/env node
/**
 * sessionStart hook — chạy khi mở chat Agent mới
 * - Kiểm tra branch hiện tại, cảnh báo nếu đang ở main
 * - Kiểm tra có uncommitted changes không
 * - Nhắc pull code mới nhất
 */

const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");

function exec(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function main() {
  console.log("=== [SHOP-AGENTIC] Session Start Hook ===");

  // 1. Lấy branch hiện tại
  const branch = exec("git rev-parse --abbrev-ref HEAD");
  if (!branch) {
    console.warn("[WARN] Không thể đọc git branch. Bỏ qua kiểm tra.");
    process.exit(0);
  }

  console.log(`[INFO] Branch hiện tại: ${branch}`);

  // Cảnh báo nếu đang commit thẳng vào main
  if (branch === "main" || branch === "master") {
    console.warn("");
    console.warn(
      '[WARN] ⚠️  Bạn đang làm việc trực tiếp trên nhánh "' + branch + '"!',
    );
    console.warn(
      "[WARN] Khuyến nghị tạo feature branch trước: git checkout -b feature/<ten-feature>",
    );
    console.warn("");
  }

  // 2. Kiểm tra uncommitted changes
  const status = exec("git status --porcelain");
  if (status && status.length > 0) {
    const lines = status.split("\n").filter(Boolean);
    console.warn(`[WARN] Có ${lines.length} file chưa được commit:`);
    lines.slice(0, 10).forEach((line) => console.warn(`       ${line}`));
    if (lines.length > 10) {
      console.warn(`       ... và ${lines.length - 10} file khác`);
    }
  } else {
    console.log("[OK] Working tree sạch — không có thay đổi chưa commit.");
  }

  // 3. Kiểm tra remote có cập nhật mới không
  exec("git fetch --quiet");
  const ahead = exec("git rev-list HEAD..@{u} --count 2>/dev/null");
  if (ahead && parseInt(ahead, 10) > 0) {
    console.warn(`[WARN] Remote có ${ahead} commit mới chưa được pull.`);
    console.warn("[WARN] Chạy: git pull origin " + branch);
  } else {
    console.log("[OK] Code đã đồng bộ với remote.");
  }

  // 4. Kiểm tra version Node
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.replace("v", "").split(".")[0], 10);
  if (major < 18) {
    console.warn(
      `[WARN] Node.js version ${nodeVersion} quá cũ. Cần Node >= 18.`,
    );
  } else {
    console.log(`[OK] Node.js ${nodeVersion}`);
  }

  console.log("=== Session Start Hook hoàn thành ===");
  process.exit(0);
}

main();
