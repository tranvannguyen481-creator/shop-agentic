# Skill: Backend Feature Pattern

> **Load this skill** whenever implementing or extending a backend feature in `shop-agentic-backend/`.
> Provides concrete, copy-paste-ready templates for every layer of the feature stack.

---

## Layer Responsibilities (strict)

| Layer          | File                                  | Responsibility                                  |
| -------------- | ------------------------------------- | ----------------------------------------------- |
| **DTO**        | `dtos/{feature}.dto.ts`               | Zod schema — validates raw request input        |
| **Controller** | `controllers/{feature}.controller.ts` | Parse request → call service → send response    |
| **Service**    | `services/{feature}.service.ts`       | All business logic + all Firestore reads/writes |
| **Router**     | `routes/{feature}.routes.ts`          | Mount middleware, connect controller methods    |
| **Types**      | `types/{feature}.types.ts`            | TS interfaces for domain objects                |
| **Constants**  | `constants/{feature}.constants.ts`    | Enums, Firestore collection name, error codes   |

**Controllers may not contain:** Firestore calls · business logic · `if` branches beyond basic guard-clauses  
**Services may not contain:** `res.json()` calls · `req.*` access · controller-level concerns

---

## Template: Constants

```ts
// src/features/discount-code/constants/discount-code.constants.ts
export const DISCOUNT_CODE_COLLECTION = "discountCodes" as const;

export const DiscountCodeError = {
  NOT_FOUND: "Discount code not found",
  EXPIRED: "Discount code has expired",
  ALREADY_USED: "Discount code has already been used",
} as const;
```

---

## Template: Types

```ts
// src/features/discount-code/types/discount-code.types.ts
import type { FirebaseFirestore } from "firebase-admin/firestore";

export interface DiscountCode {
  id: string;
  code: string;
  discountPercent: number;
  expiresAt: FirebaseFirestore.Timestamp;
  usedBy: string[]; // uids — use subcollection if this grows large
  createdBy: string; // uid
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

---

## Template: DTO

```ts
// src/features/discount-code/dtos/discount-code.dto.ts
import { z } from "zod";

export const CreateDiscountCodeDto = z.object({
  code: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, "Uppercase letters, digits, - and _ only"),
  discountPercent: z.number().int().min(1).max(100),
  expiresAt: z
    .string()
    .datetime({ message: "Must be an ISO 8601 date-time string" }),
});

export const UseDiscountCodeDto = z.object({
  code: z.string().min(1),
  orderId: z.string().min(1),
});

export type CreateDiscountCodeInput = z.infer<typeof CreateDiscountCodeDto>;
export type UseDiscountCodeInput = z.infer<typeof UseDiscountCodeDto>;
```

---

## Template: Service

```ts
// src/features/discount-code/services/discount-code.service.ts
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { AppError } from "@/shared/exceptions/AppError";
import { logger } from "@/shared/utils/logger";
import {
  DISCOUNT_CODE_COLLECTION,
  DiscountCodeError,
} from "../constants/discount-code.constants";
import type { DiscountCode } from "../types/discount-code.types";
import type { CreateDiscountCodeInput } from "../dtos/discount-code.dto";

const db = getFirestore();
const col = () => db.collection(DISCOUNT_CODE_COLLECTION);

export const discountCodeService = {
  async create(
    data: CreateDiscountCodeInput,
    createdBy: string,
  ): Promise<DiscountCode> {
    const ref = col().doc();
    const now = FieldValue.serverTimestamp();
    const payload = {
      ...data,
      id: ref.id,
      usedBy: [],
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(payload);
    logger.info("discount-code created", { id: ref.id, createdBy });
    return { ...payload, id: ref.id } as unknown as DiscountCode;
  },

  async findById(id: string): Promise<DiscountCode> {
    const snap = await col().doc(id).get();
    if (!snap.exists) throw new AppError(DiscountCodeError.NOT_FOUND, 404);
    return { id: snap.id, ...snap.data() } as DiscountCode;
  },

  async list(limit = 20): Promise<DiscountCode[]> {
    const snaps = await col().orderBy("createdAt", "desc").limit(limit).get();
    return snaps.docs.map((d) => ({ id: d.id, ...d.data() }) as DiscountCode);
  },

  async remove(id: string, requestingUid: string): Promise<void> {
    const code = await discountCodeService.findById(id);
    if (code.createdBy !== requestingUid) throw new AppError("Forbidden", 403);
    await col().doc(id).delete();
    logger.info("discount-code deleted", { id, by: requestingUid });
  },
};
```

---

## Template: Controller

```ts
// src/features/discount-code/controllers/discount-code.controller.ts
import type { Request, Response } from "express";
import { discountCodeService } from "../services/discount-code.service";
import { CreateDiscountCodeDto } from "../dtos/discount-code.dto";

export const discountCodeController = {
  async list(_req: Request, res: Response) {
    const codes = await discountCodeService.list();
    res.json(codes);
  },

  async create(req: Request, res: Response) {
    const dto = CreateDiscountCodeDto.parse(req.body);
    const code = await discountCodeService.create(dto, req.user.uid);
    res.status(201).json(code);
  },

  async getById(req: Request, res: Response) {
    const code = await discountCodeService.findById(req.params.id);
    res.json(code);
  },

  async remove(req: Request, res: Response) {
    await discountCodeService.remove(req.params.id, req.user.uid);
    res.status(204).send();
  },
};
```

---

## Template: Router

```ts
// src/features/discount-code/routes/discount-code.routes.ts
import { Router } from "express";
import { auth } from "@/shared/middleware/auth";
import { discountCodeController } from "../controllers/discount-code.controller";

export const discountCodeRouter = Router();

discountCodeRouter.get("/", auth, discountCodeController.list);
discountCodeRouter.post("/", auth, discountCodeController.create);
discountCodeRouter.get("/:id", auth, discountCodeController.getById);
discountCodeRouter.delete("/:id", auth, discountCodeController.remove);
```

---

## Template: Barrel

```ts
// src/features/discount-code/index.ts
export { discountCodeRouter } from "./routes/discount-code.routes";
```

---

## Register in `app.ts`

```ts
// src/app/app.ts  ← add these two lines in the route-registration block
import { discountCodeRouter } from "@/features/discount-code";
app.use("/api/discount-codes", discountCodeRouter);
```

---

## Error Handling Pattern

```ts
// Always use AppError — never throw plain Error
throw new AppError("Not found", 404);
throw new AppError("Forbidden", 403);
throw new AppError("Validation failed", 400);

// Never do this:
throw new Error("Not found"); // ❌ not caught by global handler
res.status(404).json({ error: "..." }); // ❌ belongs in controller, not service
```
