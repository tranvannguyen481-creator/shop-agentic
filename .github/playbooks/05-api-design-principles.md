# Playbook 05 — API Design Principles

> All backend endpoints must follow these principles. Read before designing any route.

---

## REST Resource Naming

| Resource | Collection    | Single item       | Sub-resource              |
| -------- | ------------- | ----------------- | ------------------------- |
| Events   | `GET /events` | `GET /events/:id` | `GET /events/:id/tickets` |
| Orders   | `GET /orders` | `GET /orders/:id` | —                         |
| Groups   | `GET /groups` | `GET /groups/:id` | `GET /groups/:id/members` |

Rules:

- Plural nouns for collections (`/events`, `/orders`)
- Hierarchical sub-resources reflect Firestore structure
- Actions that don't fit REST use verb-nouns: `POST /orders/:id/cancel`

---

## HTTP Methods

| Action           | Method | Status code            |
| ---------------- | ------ | ---------------------- |
| List resources   | GET    | 200                    |
| Get one resource | GET    | 200 (404 if not found) |
| Create resource  | POST   | 201                    |
| Full replace     | PUT    | 200                    |
| Partial update   | PATCH  | 200                    |
| Delete resource  | DELETE | 204 (no body)          |
| Custom action    | POST   | 200                    |

---

## Response Shape

All responses must use the standard envelope:

```ts
// Success
res.status(200).json({ data: result });
res.status(201).json({ data: created, message: "Created successfully" });

// No content
res.status(204).send();

// Errors are handled by global error-handler — never manually return error JSON
```

---

## Request Validation

Every route that accepts a body or query params **must** have a Zod DTO:

```ts
// dtos/create-event.dto.ts
export const CreateEventDto = z.object({
  title: z.string().min(1).max(200),
  startDate: z.string().datetime(),
  capacity: z.number().int().positive(),
});
export type CreateEventInput = z.infer<typeof CreateEventDto>;
```

Validate in the controller using `dto.parse(req.body)` — Zod throws on invalid input, `express-async-errors` catches it, global handler returns 422.

---

## Authentication & Authorization

- All protected routes: apply `auth` middleware before the controller.
- Check ownership inside the service using `assertActor` or manual UID comparison.
- Admin-only endpoints: separate router with admin-check middleware.

---

## Pagination

Standard query params for list endpoints:

- `?page=1&limit=20` — cursor-less pagination
- `?startAfter=<docId>&limit=20` — Firestore cursor pagination (preferred for large collections)

Always return:

```ts
{ data: items[], total?: number, nextCursor?: string }
```

---

## Error Codes

```ts
400 Bad Request          // Malformed input (unparseable JSON)
401 Unauthorized         // Missing / invalid Firebase ID token
403 Forbidden            // Valid token but insufficient permission
404 Not Found            // Resource does not exist
409 Conflict             // Duplicate or conflicting state
422 Unprocessable        // Zod validation failure
500 Internal Server Error // Unexpected — log + return generic message
```

---

## Route File Convention

```ts
// routes/event.routes.ts
import { Router } from "express";
import { auth } from "@/shared/middleware/auth";
import * as ctrl from "../controllers/event.controller";

const router = Router();

router.get("/", ctrl.listEvents);
router.get("/:id", ctrl.getEvent);
router.post("/", auth, ctrl.createEvent);
router.patch("/:id", auth, ctrl.updateEvent);
router.delete("/:id", auth, ctrl.deleteEvent);

export default router;
```
