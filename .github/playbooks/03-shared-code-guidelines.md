# Playbook 03 — Shared Code Guidelines

> Before writing anything new, check `src/shared/` on both backend and frontend.
> If the utility already exists — **use it**. If it nearly fits — **extend it**. Never duplicate.

---

## Backend — `src/shared/`

### `shared/exceptions/AppError.ts`

The **only** way to throw errors in the backend.

```ts
throw new AppError("Resource not found", 404);
throw new AppError("Unauthorized", 401);
throw new AppError("Validation failed", 422, { field: "email" });
```

Never use `throw new Error(...)` directly. Never return error objects manually.

---

### `shared/middleware/auth.ts`

Firebase ID-token verification. Apply to **all protected routes**.

```ts
import { auth } from "@/shared/middleware/auth";

router.post("/orders", auth, createOrderController);
```

After this middleware runs, `req.user` is populated with the decoded Firebase token.

---

### `shared/utils/assert-actor.ts`

Asserts that `req.user` is present and optionally that `req.user.uid` matches an expected value.
Use inside controllers to guard resource ownership.

---

### `shared/utils/firestore.utils.ts`

Firestore helper functions:

- `withConverter<T>()` — typed document converter
- `toTimestamp()` — JS Date → Firestore Timestamp
- `fromTimestamp()` — Firestore Timestamp → JS Date
- `docSnapshotToData<T>()` — snapshot → typed object with `id` field

Always use these; never write raw `.data()` casts.

---

### `shared/utils/logger.ts`

Winston logger. **Always** use this instead of `console.log`.

```ts
import { logger } from "@/shared/utils/logger";

logger.info("Order created", { orderId, userId });
logger.error("Payment failed", { error, orderId });
```

---

## Frontend — `src/shared/`

### `shared/query-client.ts`

The TanStack Query `QueryClient` singleton. Already configured with sensible defaults.
Import and use via `QueryClientProvider` in `app.tsx` (already done).

---

### `shared/services/`

Axios instance + base service utilities. All feature services should import from here.
Never create a second Axios instance.

---

### `shared/guards/`

Route guards (`RequireAuth`, `RequireRole`). Use in `file-based-routes.tsx` to protect pages.
Never re-implement auth checks inside page components.

---

### `shared/contexts/`

Global React contexts (e.g., `AuthContext`). Access via exported hooks (`useAuth()`).
Never read `localStorage` / Firebase auth state directly inside a component.

---

### `shared/hooks/`

Generic reusable hooks (e.g., `useDebounce`, `usePagination`, `useWindowSize`).
Check here before writing a new hook with the same responsibility.

---

### `shared/components/`

Reusable UI components (buttons, modals, spinners, form controls).
If a component is used in 2+ features → move it to `shared/components/`.

---

### `shared/utils/`

Pure utility functions (formatters, validators, date helpers).
No React, no Axios, no side effects.

---

## Decision Flowchart

```
Need a utility / component / hook?
    ↓
Does it exist in shared/?  → YES → Use it
    ↓ NO
Does it nearly fit?  → YES → Extend it (open a PR if shared)
    ↓ NO
Is it feature-specific?  → YES → Create in features/<name>/
    ↓ NO (used in 2+ features)
Create in shared/
```
