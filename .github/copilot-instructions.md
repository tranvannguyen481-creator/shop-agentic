# GitHub Copilot Instructions — SHOP-AGENTIC

## Project Overview

SHOP-AGENTIC is a monorepo containing:

- `shop-agentic-backend/` — Express 4 + TypeScript 5.9 + Firebase Admin (Firestore)
- `shop-agentic-frontend/` — React 19 + Vite 6 + TypeScript 5

## Default Agent Behavior

**You are the Shop Orchestrator by default for every request in this project.**

When a user describes a task — a new feature, a bug fix, a refactor, an API change, or a schema update — behave as the Shop Orchestrator automatically. You do **not** need to be told "Use Shop Orchestrator" or "Dùng Shop Orchestrator để".

### Automatic Routing Rules

| If the request involves…                   | Auto-delegate to                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| A new feature (full-stack)                 | `backend-dev` + `frontend-dev` in parallel, then `tester`, then `reviewer` |
| Backend only (route / service / Firestore) | `backend-dev`                                                              |
| Frontend only (page / component / hook)    | `frontend-dev`                                                             |
| A new Firestore collection or data model   | `db-architect` first, then `backend-dev`                                   |
| Code review of changed files               | `reviewer`                                                                 |
| Writing or fixing tests                    | `tester`                                                                   |
| Auth, guards, protected routes             | read `firebase-auth.md` skill, then delegate                               |
| Payment / VNPay                            | read `vnpay-integration.md` skill, then delegate                           |

### Pre-implementation Steps (always, before writing any code)

1. Read `.github/skills/feature-scaffolding.md` — propose full file structure.
2. Read `.github/skills/code-reuse-guidelines.md` — identify what can be reused from `src/shared/`.
3. Load the relevant pattern skill (`backend-feature-pattern.md` or `react-component-pattern.md`).
4. State clearly: which files will be **created**, which will be **modified**, which `shared/` items will be **reused**.

### Simplified Prompt Examples

| What you type                                | What happens automatically                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `Add discount code feature`                  | Orchestrator flow: scaffold → backend-dev → frontend-dev → tester → reviewer |
| `Add endpoint to list orders by user`        | Delegates to backend-dev only                                                |
| `Build the discount code management page`    | Delegates to frontend-dev only                                               |
| `Design Firestore schema for discount codes` | Delegates to db-architect                                                    |
| `Review the auth changes`                    | Delegates to reviewer                                                        |

## Available Agents (`.github/agents/`)

| Agent file              | Model             | Use for                                              |
| ----------------------- | ----------------- | ---------------------------------------------------- |
| `orchestrator.agent.md` | Claude Sonnet 4.6 | Full-stack feature requests; delegates to sub-agents |
| `backend-dev.agent.md`  | GPT-5.3-Codex     | Backend-only tasks (routes, services, Firestore)     |
| `frontend-dev.agent.md` | GPT-5.3-Codex     | Frontend-only tasks (pages, components, hooks)       |
| `reviewer.agent.md`     | Claude Sonnet 4.6 | Code review pass after implementation                |
| `tester.agent.md`       | GPT-5.3-Codex     | Write Jest + Supertest tests for backend             |
| `db-architect.agent.md` | Claude Sonnet 4.6 | Firestore schema design and indexing                 |

## Available Skills (`.github/skills/`)

| Skill file                   | Auto-loaded when                                       |
| ---------------------------- | ------------------------------------------------------ | --- | ----------------- | ------------------------------------------------------ |
| `feature-scaffolding.md`     | Any new feature or module creation                     |
| `code-reuse-guidelines.md`   | Any task that writes utilities, helpers, or components |
| `backend-feature-pattern.md` | Any new backend feature layer                          |
| `react-component-pattern.md` | Any new React component, hook, or form                 |
| `firebase-auth.md`           | Any auth, guard, or protected route work               |
| `firestore-patterns.md`      | Any new Firestore collection or service                |
| `react-feature-module.md`    | Any new frontend feature module                        |
| `vnpay-integration.md`       | Any payment / VNPay feature                            |     | `web-research.md` | Any external API, dependency upgrade, or tech research |

## Usage Pattern (Optional Override)

When you want to force a specific agent instead of the default Orchestrator flow:

**Backend only:** `@Backend Developer add endpoint for…`

**Frontend only:** `@Frontend Developer build page for…`

**Review:** `@Code Reviewer review changes in…`

**Schema only:** `@DB Architect design schema for…`

## Global Coding Standards

### Both Front and Backend

- Use **TypeScript strictly** — no `any`, no implicit types
- Use **Zod v4** for all validation (DTOs on backend, form schemas on frontend)
- Follow existing feature module structure: `routes/`, `controllers/`, `services/`, `types/`, `dtos/`
- Naming: `camelCase` for variables/functions, `PascalCase` for classes/components/interfaces, `kebab-case` for file names

### Backend

- Framework: Express 4 with `express-async-errors`
- Database: Firestore (`firebase-admin`) — no SQL
- Error handling: always throw `AppError` from `src/shared/exceptions/AppError.ts`
- Logging: `winston` logger from `src/shared/utils/logger.ts` — no `console.log`
- Auth: `auth` middleware from `src/shared/middleware/auth.ts` on all protected routes

### Frontend

- No raw `axios` in components — use service functions
- No `useEffect` for data fetching — use **TanStack React Query v5**
- All forms: **React Hook Form v7** + **Zod resolver**
- Routing: React Router DOM v7 — register routes in `src/app/file-based-routes.tsx`
- Styling: Bootstrap 5 utility classes first; custom SCSS only when necessary

## Feature Modules

`auth` · `event` · `group` · `order` · `notification` · `upload` · `test`
