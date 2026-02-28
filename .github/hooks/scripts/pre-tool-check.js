#!/usr/bin/env node
/**
 * preToolUse hook — chạy TRƯỚC khi Agent dùng tool (sửa file, chạy lệnh…)
 *
 * Luật sắt cho SHOP-AGENTIC:
 *  1. Chặn sửa/xóa file credentials (firebase JSON, .env*)
 *  2. Chặn chỉnh sửa file ngoài thư mục được phép
 *  3. Chặn lệnh nguy hiểm trong terminal (rm -rf, drop db…)
 *  4. Cảnh báo nếu code mới chứa console.log
 *
 * Exit 0  → cho phép tool chạy
 * Exit 1  → CHẶN tool (preToolUse only)
 */

const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");

// ── Thư mục được phép chỉnh sửa ───────────────────────────────────────────
const ALLOWED_DIRS = [
  "shop-agentic-backend/src",
  "shop-agentic-frontend/src",
  ".github",
];

// ── File tuyệt đối không được chạm vào ────────────────────────────────────
const BLOCKED_FILE_PATTERNS = [
  /firebase.*adminsdk.*\.json$/i, // Firebase service account key
  /\.env(\..+)?$/, // .env, .env.local, .env.production…
  /secrets?\.(json|yaml|yml|toml)$/i, // secrets file
  /private.?key/i,
];

// ── Lệnh terminal bị cấm ──────────────────────────────────────────────────
const BLOCKED_COMMANDS = [
  { pattern: /rm\s+-rf?\s+[\/~]/i, label: "rm -rf trên thư mục gốc" },
  { pattern: /drop\s+database/i, label: "DROP DATABASE" },
  {
    pattern: /firestore.*delete.*collection/i,
    label: "xóa toàn bộ Firestore collection",
  },
  {
    pattern: /git\s+push.*--force(?!-with-lease)/i,
    label: "git push --force (không an toàn, dùng --force-with-lease)",
  },
  { pattern: /npm\s+publish/i, label: "npm publish (không publish từ Agent)" },
];

// ── Pattern cần cảnh báo trong nội dung file ──────────────────────────────
const WARN_CONTENT_PATTERNS = [
  {
    pattern: /console\.(log|warn|error|info)\s*\(/g,
    label: "console.log — dùng winston logger",
  },
  {
    pattern: /:\s*any\b/g,
    label: 'TypeScript "any" — định nghĩa type rõ ràng',
  },
  {
    pattern: /\/\/\s*TODO(?!.*#\d+)/gi,
    label: "TODO không có ticket reference (vd: TODO #123)",
  },
];

function isBlockedFile(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return BLOCKED_FILE_PATTERNS.some((p) => p.test(normalized));
}

function isOutsideAllowedDirs(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  // Đường dẫn tuyệt đối → convert sang relative từ ROOT
  const relative = normalized.includes(ROOT.replace(/\\/g, "/"))
    ? normalized.replace(ROOT.replace(/\\/g, "/") + "/", "")
    : normalized;
  return !ALLOWED_DIRS.some((dir) => relative.startsWith(dir));
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let context = {};
  try {
    context = JSON.parse(input);
  } catch {
    // Không có context — cho phép
    process.exit(0);
  }

  const tool = context.tool || context.toolName || "";
  const params = context.parameters || context.input || {};

  // ── 1. Kiểm tra lệnh terminal ──────────────────────────────────────────
  const FILE_EDIT_TOOLS = [
    "create_file",
    "replace_string_in_file",
    "multi_replace_string_in_file",
    "edit_notebook_file",
    "write_file",
  ];
  const TERMINAL_TOOLS = ["run_in_terminal", "execute_command", "run_command"];

  if (
    TERMINAL_TOOLS.some((t) => tool.toLowerCase().includes(t.toLowerCase()))
  ) {
    const cmd = params.command || params.cmd || "";
    for (const { pattern, label } of BLOCKED_COMMANDS) {
      if (pattern.test(cmd)) {
        console.error(`[BLOCKED] Lệnh bị cấm phát hiện: ${label}`);
        console.error(`[BLOCKED] Lệnh: ${cmd}`);
        process.exit(1);
      }
    }
  }

  // ── 2. Kiểm tra file đang được chỉnh sửa ──────────────────────────────
  if (
    FILE_EDIT_TOOLS.some((t) => tool.toLowerCase().includes(t.toLowerCase()))
  ) {
    const filePath = params.filePath || params.path || params.file || "";

    if (filePath) {
      // 2a. File bị chặn tuyệt đối
      if (isBlockedFile(filePath)) {
        console.error(
          `[BLOCKED] File "${filePath}" bị bảo vệ và không được chỉnh sửa.`,
        );
        console.error("[BLOCKED] Lý do: credentials / secret file.");
        process.exit(1);
      }

      // 2b. File ngoài thư mục được phép
      if (isOutsideAllowedDirs(filePath)) {
        console.warn(`[WARN] File "${filePath}" nằm ngoài thư mục được phép:`);
        ALLOWED_DIRS.forEach((d) => console.warn(`       - ${d}`));
        console.warn("[WARN] Hãy xác nhận rằng đây là thay đổi có chủ đích.");
        // Chỉ warn, không block — vì .github/ cũng hợp lệ
      }

      // 2c. Cảnh báo nội dung code
      const newContent =
        params.content || params.newString || params.newCode || "";
      if (newContent && /\.(ts|tsx|js|jsx)$/.test(filePath)) {
        for (const { pattern, label } of WARN_CONTENT_PATTERNS) {
          const matches = newContent.match(
            new RegExp(pattern.source, pattern.flags),
          );
          if (matches) {
            console.warn(
              `[WARN] "${filePath}" chứa: ${label} (${matches.length} lần)`,
            );
          }
        }
      }
    }
  }

  process.exit(0);
});
