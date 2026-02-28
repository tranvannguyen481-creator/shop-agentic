# Rule: TypeScript Standards

> ENFORCE — All TypeScript code must comply with these rules.

---

## Compiler Config

Both `shop-agentic-backend/tsconfig.json` and `shop-agentic-frontend/tsconfig.json` use strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

Agents must not relax these settings.

---

## Type Rules

### No `any`

```ts
// ❌ Banned
function process(data: any) { ... }
const result: any = await service.get();

// ✅ Use proper types or generics
function process<T>(data: T) { ... }
const result: Event = await service.getEvent(id);
```

### Explicit return types on exported functions

```ts
// ✅ Required
export const getEvent = async (id: string): Promise<Event> => { ... };

// ❌ Missing return type
export const getEvent = async (id: string) => { ... };
```

### Use `unknown` instead of `any` for truly unknown inputs

```ts
// ✅ Correct
catch (err: unknown) {
  if (err instanceof AppError) { ... }
}

// ❌ Wrong
catch (err: any) { ... }
```

---

## Interfaces vs Types

| Use case                     | Prefer                    |
| ---------------------------- | ------------------------- |
| Object shapes (DTOs, models) | `interface`               |
| Unions, tuples, mapped types | `type`                    |
| Extending / implementing     | `interface`               |
| Zod-inferred types           | `type` (from `z.infer<>`) |

---

## Generics

Write generic utilities instead of duplicating logic:

```ts
// ✅ Generic Firestore helper
export function withConverter<T>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (data) => data as DocumentData,
    fromFirestore: (snap) => snap.data() as T,
  };
}
```

---

## Null / Undefined Handling

- Prefer optional chaining `?.` over null checks when the chain is short.
- Use non-null assertion `!` **only** when the value is guaranteed (e.g., after an `if (!x) throw` check).
- Never suppress TypeScript errors with `!` as a shortcut.

```ts
// ✅ Safe
const uid = req.user?.uid;
if (!uid) throw new AppError("Unauthorized", 401);

// After the guard, uid is string — safe to use
const order = await orderService.getByUser(uid);

// ❌ Risky shortcut
const order = await orderService.getByUser(req.user!.uid);
```

---

## Enum Usage

Prefer `const` objects with `as const` over TypeScript `enum` for runtime safety:

```ts
// ✅ Preferred
export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// ❌ Avoid — enums have runtime surprises
enum OrderStatus {
  PENDING,
  CONFIRMED,
  CANCELLED,
}
```

---

## Import Paths

Backend: use `@/` alias mapped to `src/`.

```ts
// ✅ Correct
import { AppError } from "@/shared/exceptions/AppError";

// ❌ Wrong — relative crawling
import { AppError } from "../../../../shared/exceptions/AppError";
```
