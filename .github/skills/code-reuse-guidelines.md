# Skill: Code Reuse Guidelines

> **Load this skill** whenever you are about to write a utility function, hook, component, guard,
> middleware, or service helper. Check for an existing implementation first — always.

---

## The Golden Rule

> **Search before you create.** If equivalent logic already exists anywhere in `shared/`, use it.
> Duplicate logic is a defect — treat it that way.

---

## Backend — What Lives in `src/shared/`

| Path                                | Reuse for                                                 |
| ----------------------------------- | --------------------------------------------------------- |
| `src/shared/middleware/auth.ts`     | **All** protected routes — never recreate auth middleware |
| `src/shared/middleware/upload.ts`   | File upload via multer — never configure multer elsewhere |
| `src/shared/exceptions/AppError.ts` | **All** expected errors — never `throw new Error()`       |
| `src/shared/utils/logger.ts`        | **All** logging — never `console.log`                     |

### How to Search Before Creating (Backend)

```
1. grep_search "function <candidateName>" in src/shared/
2. grep_search "export" in src/shared/utils/
3. grep_search "export" in src/shared/middleware/
4. If found → import and reuse. If not → create in src/shared/ (not inside the feature).
```

### When to Create in `src/shared/` vs. Inside the Feature

| Scenario                                                       | Where to put it                                 |
| -------------------------------------------------------------- | ----------------------------------------------- |
| Used by ≥ 2 features (now or clearly soon)                     | `src/shared/utils/` or `src/shared/middleware/` |
| Only used by one feature but is generic (e.g., date formatter) | `src/shared/utils/`                             |
| Only used by one feature and is highly specific                | `src/features/{feature}/`                       |

---

## Frontend — What Lives in `src/shared/`

| Path                                | Reuse for                                                  |
| ----------------------------------- | ---------------------------------------------------------- |
| `src/shared/services/`              | Base axios instance + API helpers — import `api` from here |
| `src/shared/components/ui/`         | Buttons, inputs, modals, cards, badges, spinners           |
| `src/shared/components/form/`       | Reusable form field wrappers                               |
| `src/shared/components/app-shell/`  | Layout shell, navigation, sidebar                          |
| `src/shared/components/search-bar/` | Search input pattern                                       |
| `src/shared/hooks/`                 | `useDebounce`, `usePagination`, `useLocalStorage`, etc.    |
| `src/shared/guards/`                | `AuthGuard`, role guards — wrap protected pages here       |
| `src/shared/layouts/`               | Page layout wrappers                                       |
| `src/shared/utils/`                 | Date formatting, currency formatting, string helpers       |
| `src/shared/contexts/`              | React contexts (WizardContext, etc.)                       |
| `src/shared/styles/`                | Global SCSS variables, mixins                              |

### How to Search Before Creating (Frontend)

```
1. grep_search "export" in src/shared/components/ui/
2. grep_search "export function use" in src/shared/hooks/
3. grep_search "export" in src/shared/utils/
4. If found → import and reuse. If not → create in src/shared/ (if generic) or src/features/ (if specific).
```

---

## Detecting Duplication — Checklist

Before writing any function, ask these questions:

- [ ] Is there already a hook in `src/shared/hooks/` that does this?
- [ ] Is there already a component in `src/shared/components/ui/` for this UI element?
- [ ] Is there a service helper in `src/shared/services/` that wraps this API call pattern?
- [ ] Does another feature (`auth`, `event`, `group`, `order`) already have similar logic I can extract?
- [ ] Am I about to write a second validation schema that mirrors one from another feature?

If the answer to any of these is **yes**, extract to `shared/` instead of duplicating.

---

## Extracting to `shared/` — Protocol

When you find logic that should be shared but isn't yet:

1. Create the file in the correct `shared/` subdirectory.
2. Update the origin feature to import from `shared/` instead.
3. Verify `npm run build` still passes.
4. Note the extraction in the `### Changed Files` section of your output.

### Example — Extracting a utility

```ts
// BEFORE (duplicated in two features):
// src/features/event/utils/formatCurrency.ts
// src/features/order/utils/formatCurrency.ts

// AFTER (single source of truth):
// src/shared/utils/formatCurrency.ts
export function formatCurrency(amount: number, currency = "VND"): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(
    amount,
  );
}

// Both features now import:
import { formatCurrency } from "@/shared/utils/formatCurrency";
```

---

## Import Alias

Both `shop-agentic-backend` and `shop-agentic-frontend` configure `@/` as an alias for `src/`.
Always use `@/` absolute imports — never use `../../..` relative traversal across feature boundaries.

```ts
// ✅ Correct
import { AppError } from "@/shared/exceptions/AppError";
import { auth } from "@/shared/middleware/auth";

// ❌ Wrong
import { AppError } from "../../../shared/exceptions/AppError";
```
