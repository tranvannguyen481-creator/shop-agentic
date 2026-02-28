# Rule: Naming Conventions

> ENFORCE — All code must follow these naming rules consistently.

---

## Variables & Functions

| Case                   | Use for                                                   | Example                                                  |
| ---------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `camelCase`            | Variables, function names, method names                   | `getUserById`, `orderCount`, `isLoading`                 |
| `PascalCase`           | Classes, interfaces, types, React components, Zod schemas | `EventService`, `CreateEventDto`, `OrderCard`            |
| `SCREAMING_SNAKE_CASE` | Constants, enum values, environment variable names        | `MAX_TICKETS`, `OrderStatus.PENDING`                     |
| `kebab-case`           | File names, folder names, route paths                     | `event.service.ts`, `create-order.dto.ts`, `/api/events` |

---

## File Naming

### Backend

| File type  | Pattern                  | Example               |
| ---------- | ------------------------ | --------------------- |
| Service    | `<name>.service.ts`      | `event.service.ts`    |
| Controller | `<name>.controller.ts`   | `event.controller.ts` |
| Routes     | `<name>.routes.ts`       | `event.routes.ts`     |
| DTO        | `<action>-<name>.dto.ts` | `create-event.dto.ts` |
| Types      | `<name>.types.ts`        | `event.types.ts`      |
| Constants  | `<name>.constants.ts`    | `event.constants.ts`  |

### Frontend

| File type    | Pattern             | Example                  |
| ------------ | ------------------- | ------------------------ |
| Page         | `<name>-page.tsx`   | `event-list-page.tsx`    |
| Component    | `<name>.tsx`        | `event-card.tsx`         |
| Hook         | `use-<name>.ts`     | `use-events.ts`          |
| Service      | `<name>.service.ts` | `event.service.ts`       |
| Schema (Zod) | `<name>.schema.ts`  | `create-event.schema.ts` |
| Types        | `<name>.types.ts`   | `event.types.ts`         |

---

## Interface & Type Naming

```ts
// ✅ Interfaces — no "I" prefix
interface Event { ... }
interface CreateEventInput { ... }

// ✅ Types
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
type EventWithId = Event & { id: string };

// ❌ Avoid
interface IEvent { ... }    // No "I" prefix
type TEvent = { ... }       // No "T" prefix
```

---

## React Component Naming

```tsx
// ✅ PascalCase, matches file name
// File: event-card.tsx
export const EventCard = ({ event }: EventCardProps) => { ... };

// ✅ Props interface: ComponentName + "Props"
interface EventCardProps {
  event: Event;
  onSelect?: (id: string) => void;
}

// ❌ Avoid
export default function eventCard() { ... }  // lowercase = not a component
```

---

## Hook Naming

All custom hooks must start with `use`:

```ts
// ✅
export const useEvents = () => { ... };
export const useCreateOrder = () => { ... };

// ❌
export const fetchEvents = () => { ... };  // not a hook — put in services/
```

---

## Firestore Field Naming

```ts
// ✅ camelCase Firestore fields
{
  userId: 'abc123',
  createdAt: Timestamp,
  ticketCount: 5,
  isPublished: true,
}

// ❌ Avoid
{
  user_id: 'abc123',       // snake_case
  created_at: Timestamp,
  TicketCount: 5,          // PascalCase
}
```

---

## Route Path Naming

```
✅ /api/events               (plural noun, lowercase)
✅ /api/events/:id
✅ /api/events/:id/tickets
✅ /api/orders/:id/cancel    (verb-noun for actions)

❌ /api/getEvents             (verb in path)
❌ /api/Event                 (singular, PascalCase)
❌ /api/event_list            (snake_case)
```
