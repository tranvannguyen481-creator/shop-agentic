# Playbook: Firebase Auth

> Read this file before implementing anything related to authentication or authorization.

## How Auth Works in SHOP-AGENTIC

```
Frontend                         Backend
  │                                 │
  ├─ signInWithEmailAndPassword()   │
  │  (Firebase client SDK)          │
  │                                 │
  ├─ user.getIdToken()              │
  │  → Bearer token in header  ──►  auth middleware
  │                                 ├─ admin.auth().verifyIdToken(token)
  │                                 ├─ attaches req.user = DecodedIdToken
  │                                 └─ calls next()
```

## Backend — Auth Middleware (`src/shared/middleware/auth.ts`)

The middleware already exists. **Never recreate it.** Just import and use it:

```ts
import { auth } from "@/shared/middleware/auth";

router.get("/protected", auth, controller.handler);
```

After `auth` runs, `req.user` contains the Firebase `DecodedIdToken`:

```ts
// Access in controller/service:
const uid = req.user.uid;
const email = req.user.email;
```

The `req.user` type comes from `src/types/express.d.ts` — do not redefine it.

## Backend — Role / Ownership Checks

```ts
// In service — throw AppError, never check in controller
if (doc.userId !== requestingUid) {
  throw new AppError("Forbidden", 403);
}
```

## Frontend — Auth Hooks (`src/features/auth/hooks/`)

Do not use Firebase SDK directly in pages or components — always go through the existing hooks.

```ts
// Use existing hooks — don't recreate:
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useSignIn } from "@/features/auth/hooks/useSignIn";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
```

Before creating a new auth hook, search `src/features/auth/hooks/` to see if it already exists.

## Frontend — Protected Routes

Wrap any page that requires authentication:

```tsx
// src/app/file-based-routes.tsx
{
  path: '/orders',
  element: (
    <AuthGuard>
      <OrdersPage />
    </AuthGuard>
  ),
}
```

Use the guard from `src/shared/guards/` — never write inline auth checks in page components.

## Token Refresh

The Firebase client SDK handles token refresh automatically. In Axios:

```ts
// src/shared/services/api.ts — already configured
// The interceptor calls user.getIdToken(true) on 401 and retries once.
// Do not add another retry interceptor.
```

## Mandatory Rules

- Never store the Firebase ID token in `localStorage` — rely on the Firebase SDK's in-memory token.
- Never create a custom JWT — only use Firebase ID tokens.
- Never put the Firebase service account key (`*.json`) in any file that is committed — it must stay in `.gitignore`.
- Ownership checks (`userId === req.user.uid`) happen in the **service layer**, never in controllers.
- Every new protected route gets the `auth` middleware — no exceptions.
