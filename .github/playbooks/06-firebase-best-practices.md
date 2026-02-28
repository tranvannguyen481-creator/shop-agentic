# Playbook 06 — Firebase Best Practices

> Reference for all Firestore interactions in this project.

---

## Firestore Initialization

Always import the admin instance from the central config — never re-initialize:

```ts
import { db } from "@/app/config/firebaseAdmin";
```

---

## Collection Constants

Collection names live in `features/<name>/constants/` as enum or const:

```ts
// features/event/constants/collections.ts
export const COLLECTIONS = {
  EVENTS: "events",
  EVENT_TICKETS: "eventTickets",
} as const;
```

Never inline collection name strings in service files.

---

## Typed Document Access

Always use the Firestore converter from `firestore.utils.ts`:

```ts
import { withConverter } from "@/shared/utils/firestore.utils";
import { Event } from "../types/event.types";

const eventRef = db
  .collection(COLLECTIONS.EVENTS)
  .withConverter(withConverter<Event>());

const snap = await eventRef.doc(id).get();
if (!snap.exists) throw new AppError("Event not found", 404);
const event = snap.data()!; // typed as Event
```

---

## Timestamps

- Store all dates as Firestore `Timestamp` — never as ISO strings in Firestore.
- Convert on read/write using `toTimestamp()` / `fromTimestamp()` from `firestore.utils.ts`.
- Expose ISO strings to the API layer.

```ts
createdAt: toTimestamp(new Date()),
updatedAt: toTimestamp(new Date()),
```

---

## Queries

### Fetch list with pagination (preferred: cursor-based)

```ts
let query = db
  .collection(COLLECTIONS.EVENTS)
  .withConverter(withConverter<Event>())
  .orderBy("createdAt", "desc")
  .limit(limit);

if (startAfter) {
  const cursor = await db.collection(COLLECTIONS.EVENTS).doc(startAfter).get();
  query = query.startAfter(cursor);
}

const snap = await query.get();
const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
```

### Transactions (for concurrent-safe writes)

Use `db.runTransaction()` for any operation that reads then writes the same document:

```ts
await db.runTransaction(async (tx) => {
  const ref = db.collection(COLLECTIONS.EVENTS).doc(eventId);
  const snap = await tx.get(ref);
  if (!snap.exists) throw new AppError("Event not found", 404);
  const current = snap.data()!;
  if (current.soldCount >= current.capacity)
    throw new AppError("Sold out", 409);
  tx.update(ref, { soldCount: current.soldCount + quantity });
});
```

### Batch writes (for multiple independent writes)

```ts
const batch = db.batch();
batch.set(db.collection("orders").doc(), orderData);
batch.update(db.collection("events").doc(eventId), {
  soldCount: FieldValue.increment(qty),
});
await batch.commit();
```

---

## Security Rules (Reminder)

Backend uses the Admin SDK — it bypasses Firestore security rules.
Security enforcement happens in our `auth` middleware and service layer.
Never rely on client-side rules for backend data integrity.

---

## Indexes

- Composite indexes are required for queries with `where` + `orderBy` on different fields.
- Add compound indexes to `firestore.indexes.json` when needed.
- Document new indexes in the relevant feature `README` or `db-architect` agent output.

---

## Anti-patterns to Avoid

- ❌ `doc.data() as MyType` without converter — loses type safety
- ❌ Storing nested arrays that grow unboundedly — use sub-collections
- ❌ Fetching a document just to check if it exists — use `.get()` and check `.exists`
- ❌ Multiple writes outside a batch when atomicity matters
- ❌ Storing Firebase UIDs in a field named `id` — use `uid` to avoid collision with Firestore doc ID
