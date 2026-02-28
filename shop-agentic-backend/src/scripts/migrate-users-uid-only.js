const admin = require("../config/firebaseAdmin");

const USERS_COLLECTION = "users";
const BATCH_LIMIT = 400;

const db = admin.firestore();

async function migrateUsersUidOnly() {
  const snapshot = await db.collection(USERS_COLLECTION).get();

  if (snapshot.empty) {
    console.log("No users found. Nothing to migrate.");
    return;
  }

  let batch = db.batch();
  let operations = 0;
  let updatedCount = 0;

  const flushBatch = async () => {
    if (operations === 0) {
      return;
    }

    await batch.commit();
    batch = db.batch();
    operations = 0;
  };

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const nextUid =
      typeof data.uid === "string" && data.uid.trim()
        ? data.uid.trim()
        : doc.id;

    batch.set(
      doc.ref,
      {
        uid: nextUid,
        id: admin.firestore.FieldValue.delete(),
        firebaseUid: admin.firestore.FieldValue.delete(),
      },
      { merge: true },
    );

    operations += 1;
    updatedCount += 1;

    if (operations >= BATCH_LIMIT) {
      await flushBatch();
    }
  }

  await flushBatch();

  console.log(`Users migrated: ${updatedCount}`);
}

migrateUsersUidOnly()
  .then(() => {
    console.log("Migration completed.");
    process.exit(0);
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Migration failed: ${message}`);
    process.exit(1);
  });
