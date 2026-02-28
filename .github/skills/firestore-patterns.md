# Playbook: Firestore Patterns

> Read this file before designing any new Firestore collection or writing service-layer code.

## Collection Naming

- Use `camelCase` for collection names: `orders`, `eventGroups`, `notifications`
- Use `camelCase` for all field names
- Document IDs: use Firestore auto-ID (`db.collection('x').doc()`) unless a natural key exists (e.g., Firebase `uid` for users)

## Service Layer Template

```ts
import { db } from "@/app/config/firebaseAdmin";
import { AppError } from "@/shared/exceptions/AppError";
import { logger } from "@/shared/utils/logger";
import type { FeatureDoc } from "../types/feature.types";

const COL = "featureName"; // collection constant — never inline the string

export const featureService = {
  async getById(id: string): Promise<FeatureDoc> {
    const snap = await db.collection(COL).doc(id).get();
    if (!snap.exists) throw new AppError("Not found", 404);
    return { id: snap.id, ...snap.data() } as FeatureDoc;
  },

  async list(
    userId: string,
    limit = 20,
    startAfter?: string,
  ): Promise<FeatureDoc[]> {
    let q = db
      .collection(COL)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit);
    if (startAfter) {
      const cursor = await db.collection(COL).doc(startAfter).get();
      q = q.startAfter(cursor);
    }
    const snap = await q.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FeatureDoc);
  },

  async create(
    data: Omit<FeatureDoc, "id" | "createdAt" | "updatedAt">,
  ): Promise<FeatureDoc> {
    const ref = db.collection(COL).doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    await ref.set({ ...data, createdAt: now, updatedAt: now });
    logger.info(`[${COL}] created ${ref.id}`);
    return featureService.getById(ref.id);
  },

  async update(id: string, data: Partial<FeatureDoc>): Promise<void> {
    const snap = await db.collection(COL).doc(id).get();
    if (!snap.exists) throw new AppError("Not found", 404);
    await db
      .collection(COL)
      .doc(id)
      .update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  },

  async delete(id: string): Promise<void> {
    const snap = await db.collection(COL).doc(id).get();
    if (!snap.exists) throw new AppError("Not found", 404);
    await db.collection(COL).doc(id).delete();
  },
};
```

## Pagination (cursor-based — always use this pattern)

```ts
// Request DTO
const ListQueryDto = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startAfter: z.string().optional(),
});

// Response shape
{ data: FeatureDoc[], nextCursor: string | null }
// nextCursor = last doc ID if results === limit, else null
```

Never use offset-based pagination (`offset`, `skip`) — Firestore reads every skipped doc.

## Batch Writes (multi-document atomicity)

```ts
const batch = db.batch();
batch.set(db.collection("orders").doc(orderId), orderData);
batch.update(db.collection("inventory").doc(itemId), {
  stock: admin.firestore.FieldValue.increment(-qty),
});
await batch.commit(); // atomic — all or nothing
```

Use batch for ≤ 500 operations. Use a Transaction when you need to read before writing.

## Mandatory Rules

- Never call `db` inside a controller — only inside service methods.
- Always use `admin.firestore.FieldValue.serverTimestamp()` for time fields.
- Never use `new Date()` or `Date.now()` for Firestore timestamps.
- Always check `.exists` before reading `.data()` from a `DocumentSnapshot`.
- Throw `AppError('Not found', 404)` when a document is missing — never return `null` from a service.
- Use a `COL` constant at the top of every service file — never inline the collection name string.
- Always add `.limit()` to every collection query.
