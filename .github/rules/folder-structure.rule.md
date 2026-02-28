# Rule: Folder Structure

> ENFORCE — Files must live in the correct location. No exceptions without team discussion.

---

## The Golden Rule

> **The location of a file determines its scope and ownership.**

- Feature-specific code → `features/<name>/`
- Cross-feature reusable code → `shared/`
- App bootstrapping → `app/`
- One-off scripts → `scripts/`

---

## Backend Folder Rules

### Feature folders are isolated

Each feature only imports from:

1. Its own files (`./services/...`, `./types/...`)
2. `@/shared/` utilities and middleware
3. `express`, `firebase-admin`, and other `node_modules`

**Features must NOT import from other features.**

```ts
// ✅ OK
import { db } from "@/app/config/firebaseAdmin";
import { AppError } from "@/shared/exceptions/AppError";
import { EventService } from "./services/event.service";

// ❌ Cross-feature import — banned
import { OrderService } from "@/features/order/services/order.service";
```

If feature A needs data from feature B → expose a shared service in `shared/` or
call the other feature's Firestore collection directly with its types.

---

### Where each file type goes

```
features/<name>/
├── constants/    ← Enums, collection names, config values
├── controllers/  ← HTTP handlers ONLY (no business logic)
├── dtos/         ← Zod schemas for request body / query params
├── routes/       ← Express Router (wiring only)
├── services/     ← Business logic + Firestore queries
└── types/        ← TypeScript interfaces for this feature
```

**Never put business logic in:**

- `routes/` — routing only
- `controllers/` — parse input, call service, send response
- `dtos/` — schema definitions only
- `types/` — type definitions only

---

### `shared/` is not a dumping ground

Only move code to `shared/` when it meets ALL criteria:

1. Used by 2 or more features (or likely to be)
2. Has no feature-specific state or imports
3. Is generic enough to apply to future features

---

## Frontend Folder Rules

### Feature folders

```
features/<name>/
├── components/   ← Feature-specific UI components
├── constants/    ← Route paths, enums
├── hooks/        ← React Query hooks for this feature
├── pages/        ← One file per route (registered in file-based-routes.tsx)
├── schemas/      ← Zod form validation schemas
├── services/     ← Axios calls for this feature
├── types/        ← TypeScript interfaces
└── utils/        ← Pure utility functions
```

### Page components

- One page component per route.
- Registered in `src/app/file-based-routes.tsx`.
- Never registered directly in `app.tsx`.
- Page components are thin: render layout + composed components, delegate to hooks.

### Route guards

- Guards live in `src/shared/guards/`.
- Apply in `file-based-routes.tsx` (wrapper component), not inside the page component.

---

## Prohibited Patterns

```
❌ src/features/event/utils/order-helper.ts   (order logic in event folder)
❌ src/features/auth/components/EventCard.tsx  (event component in auth folder)
❌ src/app/event.service.ts                    (service in app/ folder)
❌ src/shared/event.service.ts                 (single-feature service in shared)
❌ src/index.service.ts                        (root-level service)
```

---

## Adding a New Feature

When creating a new feature module, always scaffold the FULL directory structure:

```bash
# Backend
mkdir -p src/features/<name>/{constants,controllers,dtos,routes,services,types}
touch src/features/<name>/index.ts

# Frontend
mkdir -p src/features/<name>/{components,constants,hooks,pages,schemas,services,types,utils}
```

Register the backend router in `app/app.ts` and frontend routes in `app/file-based-routes.tsx`.
