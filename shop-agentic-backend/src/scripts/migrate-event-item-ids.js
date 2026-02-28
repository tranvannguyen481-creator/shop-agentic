/**
 * Migration: Gán Firestore-generated ID cho từng item trong mảng event.items
 * nếu item chưa có ID (hoặc `id` rỗng).
 *
 * Chạy 1 lần:
 *   node src/scripts/migrate-event-item-ids.js
 *
 * An toàn để chạy lại — item đã có ID sẽ được giữ nguyên.
 */

const admin = require("../config/firebaseAdmin");

const EVENTS_COLLECTION = "events";
const BATCH_LIMIT = 400; // Firestore giới hạn 500 writes per batch

const db = admin.firestore();

async function migrateEventItemIds() {
  console.log("🚀 Bắt đầu migration: gán ID cho event items...\n");

  const snapshot = await db.collection(EVENTS_COLLECTION).get();

  if (snapshot.empty) {
    console.log("Không tìm thấy event nào. Kết thúc.");
    process.exit(0);
  }

  console.log(`📋 Tổng số event cần kiểm tra: ${snapshot.size}`);

  let batch = db.batch();
  let batchOps = 0;
  let eventsUpdated = 0;
  let itemsAssigned = 0;
  let eventsSkipped = 0;

  const flushBatch = async () => {
    if (batchOps === 0) return;
    await batch.commit();
    batch = db.batch();
    batchOps = 0;
    console.log(`  ✅ Batch committed.`);
  };

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const rawItems = Array.isArray(data.items) ? data.items : [];

    // Kiểm tra xem có item nào thiếu ID không
    const needsMigration = rawItems.some(
      (item) => !item || typeof item.id !== "string" || !item.id.trim(),
    );

    if (!needsMigration) {
      eventsSkipped++;
      continue;
    }

    let assigned = 0;
    const updatedItems = rawItems.map((item) => {
      if (!item || typeof item !== "object") return item;
      const hasId = typeof item.id === "string" && item.id.trim();
      if (hasId) return item;

      assigned++;
      return {
        ...item,
        id: db.collection("_").doc().id,
      };
    });

    batch.update(doc.ref, { items: updatedItems });
    batchOps++;
    eventsUpdated++;
    itemsAssigned += assigned;

    console.log(
      `  📝 Event "${doc.id}" (${data.title ?? "—"}): ${assigned} item(s) cần gán ID`,
    );

    if (batchOps >= BATCH_LIMIT) {
      await flushBatch();
    }
  }

  await flushBatch();

  console.log("\n─────────────────────────────────────────");
  console.log(`✅ Migration hoàn tất!`);
  console.log(`   Events đã cập nhật : ${eventsUpdated}`);
  console.log(`   Items được gán ID  : ${itemsAssigned}`);
  console.log(`   Events không cần   : ${eventsSkipped}`);
  console.log("─────────────────────────────────────────\n");
}

migrateEventItemIds()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Migration thất bại:", err);
    process.exit(1);
  });
