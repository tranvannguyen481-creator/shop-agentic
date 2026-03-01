#!/usr/bin/env node
/**
 * userPromptSubmitted hook — chạy ngay sau khi user gửi prompt
 * - Kiểm tra từ/pattern bị cấm trong prompt
 * - Nhắc nhở tuân theo coding standards của SHOP-AGENTIC
 *
 * Exit 0  → cho phép tiếp tục
 * Exit 1  → từ chối (chặn Agent xử lý prompt)
 */

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let context = {};
  try {
    context = JSON.parse(input);
  } catch {
    // stdin rỗng hoặc không phải JSON — bỏ qua
  }

  const prompt = (context.prompt || "").toLowerCase();
  const warnings = [];

  // ── Các lệnh / từ khóa nguy hiểm ──────────────────────────────────────
  const DANGEROUS_PATTERNS = [
    {
      pattern: /drop\s+database|delete\s+all|truncate/i,
      label: "thao tác xóa toàn bộ database",
    },
    { pattern: /rm\s+-rf\s+\//i, label: "lệnh xóa hệ thống (rm -rf /)" },
    {
      pattern: /firebase.*service.?account.*key/i,
      label: "lộ Service Account Key",
    },
    {
      pattern: /push.*(secret|password|private.?key|token)/i,
      label: "push secret/token lên repo",
    },
  ];

  for (const { pattern, label } of DANGEROUS_PATTERNS) {
    if (pattern.test(prompt)) {
      console.error(`[BLOCKED] Prompt chứa pattern nguy hiểm: "${label}"`);
      console.error("[BLOCKED] Vui lòng xem xét lại yêu cầu.");
      process.exit(1);
    }
  }

  // ── Nhắc nhở coding standards ─────────────────────────────────────────
  const REMINDERS = [
    {
      pattern: /console\.log/i,
      msg: "Dùng winston logger (src/shared/utils/logger.ts) thay cho console.log",
    },
    {
      pattern: /\bany\b/,
      msg: 'Tránh dùng kiểu "any" trong TypeScript — hãy định nghĩa interface/type rõ ràng',
    },
    {
      pattern: /axios\b/i,
      msg: "Không gọi axios trực tiếp trong component — dùng service function",
    },
    {
      pattern: /useeffect.*fetch|fetch.*useeffect/i,
      msg: "Không dùng useEffect để fetch data — dùng TanStack React Query v5",
    },
    {
      pattern: /sql|sequelize|prisma|typeorm/i,
      msg: "Project này dùng Firestore (firebase-admin), không dùng SQL/ORM",
    },
  ];

  for (const { pattern, msg } of REMINDERS) {
    if (pattern.test(prompt)) {
      warnings.push(msg);
    }
  }

  // ── In nhắc nhở ────────────────────────────────────────────────────────
  if (warnings.length > 0) {
    console.warn("[SHOP-AGENTIC] Lưu ý coding standards:");
    warnings.forEach((w, i) => console.warn(`  ${i + 1}. ${w}`));
  }

  // ── Nhắc dùng Orchestrator ─────────────────────────────────────────────
  console.log(
    "[SHOP-AGENTIC] Dùng orchestrator.agent.md để điều phối công việc",
  );

  process.exit(0);
});
