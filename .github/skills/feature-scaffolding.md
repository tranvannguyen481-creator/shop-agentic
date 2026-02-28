# Skill: Feature Scaffolding

> **Load this skill** before creating any new feature — backend, frontend, or full-stack.
> Agents must follow this process exactly.

---

## Step 1 — Analyze Before Creating

Before writing a single line of code, do the following in order:

1. **Search for similar code** in `src/features/` (both repos) to find reusable patterns.
2. **Search `src/shared/`** (backend) and `src/shared/` (frontend) for utilities, guards, hooks, and components that already cover the needed functionality.
3. **Propose a file structure** — a concrete list of every file to create or modify — before creating anything.
4. **State which existing files will be reused or imported** vs. which are new.

Only proceed to Step 2 after the structure is clear and confirmed.

---

## Step 2 — Backend Scaffold (shop-agentic-backend)

For a feature named `{feature}` (use `kebab-case`):

```
src/features/{feature}/
├── index.ts                    ← barrel: exports the Express router
├── routes/
│   └── {feature}.routes.ts    ← router with auth + Zod middlewares
├── controllers/
│   └── {feature}.controller.ts ← thin handlers only (no logic, no Firestore)
├── services/
│   └── {feature}.service.ts   ← all business logic + Firestore calls
├── dtos/
│   └── {feature}.dto.ts       ← Zod schemas for every request body/param
├── types/
│   └── {feature}.types.ts     ← TypeScript interfaces
└── constants/
    └── {feature}.constants.ts ← enums, error codes, collection names
```

**Register the router:** add `import`+`app.use()` to `src/app/app.ts`.

---

## Step 3 — Frontend Scaffold (shop-agentic-frontend)

For the same `{feature}`:

```
src/features/{feature}/
├── pages/
│   └── {Feature}Page.tsx       ← route-level component
├── components/
│   └── {Feature}Card.tsx       ← presentational UI
├── hooks/
│   └── use{Feature}.ts         ← React Query useQuery / useMutation
├── services/
│   └── {feature}.service.ts    ← axios wrapper (never call axios in components)
├── schemas/
│   └── {feature}.schema.ts     ← Zod schemas (must mirror backend DTOs)
├── types/
│   └── {feature}.types.ts      ← interfaces matching backend response types
└── constants/
    └── {feature}.constants.ts
```

**Register routes:** update `src/app/file-based-routes.tsx` and `src/app/route-config.tsx`.

---

## Step 4 — Cross-Cutting Checklist

Run through every item before marking a feature complete:

| Check                                                   | Backend | Frontend |
| ------------------------------------------------------- | ------- | -------- |
| Barrel `index.ts` exports router / main hook            | ✅      | ✅       |
| Router registered in `app.ts` / `file-based-routes.tsx` | ✅      | ✅       |
| Auth guard applied to protected routes                  | ✅      | ✅       |
| Zod DTO validates every incoming payload                | ✅      | ✅       |
| Types on both sides are in sync                         | ✅      | ✅       |
| No logic in controllers / no axios in components        | ✅      | ✅       |
| `npm run build` passes with zero TypeScript errors      | ✅      | ✅       |

---

## Naming Conventions

| Artifact                          | Convention             | Example                    |
| --------------------------------- | ---------------------- | -------------------------- |
| File names                        | `kebab-case`           | `discount-code.service.ts` |
| Variables / functions             | `camelCase`            | `getDiscountCode`          |
| Classes / interfaces / components | `PascalCase`           | `DiscountCodeService`      |
| Enums / constants                 | `SCREAMING_SNAKE_CASE` | `DISCOUNT_NOT_FOUND`       |
| Firestore collection keys         | `camelCase`            | `discountCodes`            |

---

## Minimal Working Examples

### `index.ts` (backend barrel)

```ts
// src/features/discount-code/index.ts
export { discountCodeRouter } from "./routes/discount-code.routes";
```

### `{feature}.routes.ts`

```ts
import { Router } from "express";
import { auth } from "@/shared/middleware/auth";
import { discountCodeController } from "../controllers/discount-code.controller";

export const discountCodeRouter = Router();

discountCodeRouter.get("/", auth, discountCodeController.list);
discountCodeRouter.post("/", auth, discountCodeController.create);
discountCodeRouter.get("/:id", auth, discountCodeController.getById);
discountCodeRouter.delete("/:id", auth, discountCodeController.remove);
```

### `{feature}.dto.ts`

```ts
import { z } from "zod";

export const CreateDiscountCodeDto = z.object({
  code: z.string().min(3).max(20),
  discountPercent: z.number().int().min(1).max(100),
  expiresAt: z.string().datetime(),
});

export type CreateDiscountCodeInput = z.infer<typeof CreateDiscountCodeDto>;
```
