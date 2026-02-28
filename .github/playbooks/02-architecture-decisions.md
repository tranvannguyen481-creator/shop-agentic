# Playbook 02 — Architecture Decisions

> Immutable decisions made for this project. Agents must not override these.

---

## Backend

| Decision       | Choice                               | Reason                                                      |
| -------------- | ------------------------------------ | ----------------------------------------------------------- |
| Framework      | Express 4                            | Lightweight, well-understood, team expertise                |
| Language       | TypeScript 5.9 (strict)              | Full type safety end-to-end                                 |
| Database       | Firestore (Firebase Admin SDK)       | Real-time, scalable NoSQL, no server management             |
| Auth           | Firebase Authentication (ID tokens)  | Seamless Firestore integration, OAuth support               |
| Validation     | Zod v4 on all DTOs                   | Runtime safety + TypeScript inference                       |
| Error handling | Single global handler via `AppError` | Consistent error shape across all endpoints                 |
| Logging        | Winston (structured JSON)            | Production-grade, queryable logs                            |
| File storage   | `public/images/` via Multer          | Simple local storage; migrate to Firebase Storage if needed |
| Async errors   | `express-async-errors`               | No try/catch boilerplate in controllers                     |

## Frontend

| Decision     | Choice                            | Reason                                             |
| ------------ | --------------------------------- | -------------------------------------------------- |
| Framework    | React 19                          | Latest concurrent features                         |
| Build tool   | Vite 6                            | Fast HMR, modern ESM                               |
| Language     | TypeScript 5 (strict)             | Type safety                                        |
| Routing      | React Router DOM v7               | File-based route config                            |
| Server state | TanStack React Query v5           | Cache, background refresh, no `useEffect` fetching |
| Forms        | React Hook Form v7 + Zod resolver | Performant, schema-driven forms                    |
| Styling      | Bootstrap 5 + custom SCSS         | Utility-first, minimal custom CSS                  |
| HTTP client  | Axios (service layer only)        | Interceptors, typed responses                      |

---

## What We Do NOT Use

- ❌ Redux / Zustand — React Query handles server state; `useContext` for minimal client state
- ❌ SQL / Prisma — Firestore only
- ❌ GraphQL — REST API only
- ❌ `console.log` — Winston logger only on the backend
- ❌ Direct `axios` in components — always via service functions
- ❌ `useEffect` for data fetching — always via React Query hooks
- ❌ `any` in TypeScript — strict mode, no escape hatches

---

## API Design Contract

All API responses follow this shape:

```ts
// Success (2xx)
{ data: T, message?: string }

// Error (4xx / 5xx)
{ error: string, code?: string, statusCode: number }
```

Error responses are produced exclusively by `AppError` + the global error handler.

---

## Firestore Collection Naming

- Collections: `camelCase` plural (e.g., `events`, `orders`, `groupMembers`)
- Documents: auto-generated Firestore IDs unless specified otherwise
- Sub-collections: used sparingly; prefer root collections with foreign keys
