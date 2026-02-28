# Rule: Coding Standards

> ENFORCE — Agents must always comply. These are non-negotiable.

---

## General

- **TypeScript strict mode** is ON. No `any`, no `// @ts-ignore`, no `// @ts-expect-error` without explicit justification.
- All new files must be `.ts` or `.tsx`. No `.js` files in `src/`.
- All exports are named exports. Avoid default exports unless the framework requires it (e.g., React Router route components).

---

## Backend

### Error Handling — MANDATORY

```ts
// ✅ Correct
throw new AppError("Event not found", 404);

// ❌ Never do this
throw new Error("Event not found");
res.status(404).json({ error: "Event not found" });
```

### Logging — MANDATORY

```ts
// ✅ Correct
import { logger } from "@/shared/utils/logger";
logger.info("Order created", { orderId });

// ❌ Never do this
console.log("Order created", orderId);
console.error("Something failed");
```

### Controllers — must be thin

```ts
// ✅ Correct
export const createEvent = async (req: Request, res: Response) => {
  const input = CreateEventDto.parse(req.body);
  const event = await eventService.create(input, req.user!.uid);
  res.status(201).json({ data: event });
};

// ❌ Too fat — business logic in controller
export const createEvent = async (req: Request, res: Response) => {
  const existing = await db
    .collection("events")
    .where("title", "==", req.body.title)
    .get();
  if (!existing.empty) throw new AppError("Duplicate", 409);
  // ... more logic
};
```

### Validation — always Zod

Every endpoint that accepts external input **must** have a Zod DTO.
Parse at the top of the controller before calling any service.

---

## Frontend

### Data Fetching — MANDATORY

```tsx
// ✅ Correct — React Query hook
const { data: events, isLoading } = useEvents();

// ❌ Never fetch in useEffect
useEffect(() => {
  axios.get("/api/events").then(setEvents);
}, []);
```

### API Calls — service layer only

```ts
// ✅ Correct — in features/event/services/event.service.ts
export const fetchEvents = async (): Promise<Event[]> => {
  const { data } = await apiClient.get("/events");
  return data.data;
};

// ❌ Raw axios in component
const res = await axios.get("/api/events");
```

### Forms — React Hook Form + Zod

```tsx
// ✅ Correct
const form = useForm<CreateEventInput>({
  resolver: zodResolver(CreateEventSchema),
});

// ❌ useState-controlled form
const [title, setTitle] = useState("");
```

---

## Code Review Gate

A PR is **not mergeable** if any of these are violated:

1. `tsc --noEmit` reports errors
2. `any` type introduced without a documented reason
3. `console.log` present in backend code
4. `useEffect` used for data fetching
5. Raw `axios` used inside a component
6. Business logic added to a controller or page component
