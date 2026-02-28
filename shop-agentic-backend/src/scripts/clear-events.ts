/**
 * Script: clear-events
 * Deletes every document in the `events` and `userHostedEvents` Firestore
 * collections.  Run with:
 *   npm run script:clear-events
 */

import admin from "firebase-admin";
import "../app/config/firebaseAdmin";

const db = admin.firestore();

const BATCH_SIZE = 400; // Firestore limit is 500 ops per batch

async function deleteCollection(collectionPath: string): Promise<number> {
  let totalDeleted = 0;

  while (true) {
    const snapshot = await db
      .collection(collectionPath)
      .limit(BATCH_SIZE)
      .get();

    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    totalDeleted += snapshot.size;
    console.log(
      `  [${collectionPath}] deleted ${snapshot.size} docs (total so far: ${totalDeleted})`,
    );
  }

  return totalDeleted;
}

async function main() {
  console.log("=== clear-events ===");

  const collectionsToWipe = ["events", "userHostedEvents"];

  for (const col of collectionsToWipe) {
    console.log(`Clearing '${col}'...`);
    const count = await deleteCollection(col);
    console.log(`  Done — ${count} document(s) deleted.\n`);
  }

  console.log("All done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
