# GitHub Copilot Setup — shop-agentic

> For team members joining the project: read this first before using Copilot.

---

## Overview

This project is configured with a professional GitHub Copilot agent system that gives Copilot deep context about the codebase, enforces coding standards automatically, and enables powerful prompt shortcuts.

---

## Directory Map

```
.github/
├── agents/          ← Specialist agents (personas)
├── skills/          ← On-demand deep knowledge
├── playbooks/       ← Always-loaded project knowledge
├── rules/           ← Hard-enforced coding standards
├── prompts/         ← Reusable prompt templates
└── copilot-instructions.md   ← Default agent behaviour
```

---

## How Copilot Behaves By Default

Every request to Copilot in this project is automatically handled by the **Shop Orchestrator** agent defined in `copilot-instructions.md`.

You do **not** need to say "use the orchestrator" or reference any agent manually.

Just describe what you want in plain language:

| You type                                     | What happens                                                         |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `Add discount code feature`                  | Full-stack scaffold → backend-dev → frontend-dev → tester → reviewer |
| `Add endpoint for listing orders by user`    | Delegates to backend-dev                                             |
| `Build the discount code management page`    | Delegates to frontend-dev                                            |
| `Design Firestore schema for discount codes` | Delegates to db-architect                                            |
| `Review the auth changes`                    | Delegates to reviewer                                                |

---

## Using Prompt Templates

The `prompts/` folder contains reusable templates for common tasks.
Reference them when making requests for more structured output:

```
Use @prompt/new-feature — I want to add [feature name]

Use @prompt/refactor — Refactor [file path]

Use @prompt/full-code-review — Review all changes in the order module

Use @prompt/research — Research the best way to add real-time updates
```

---

## Agents

| Agent              | File                           | Best used for                 |
| ------------------ | ------------------------------ | ----------------------------- |
| Orchestrator       | `agents/orchestrator.agent.md` | Default — full-stack features |
| Backend Developer  | `agents/backend-dev.agent.md`  | Routes, services, Firestore   |
| Frontend Developer | `agents/frontend-dev.agent.md` | Pages, components, hooks      |
| Code Reviewer      | `agents/reviewer.agent.md`     | Review after implementation   |
| Tester             | `agents/tester.agent.md`       | Jest + Supertest tests        |
| DB Architect       | `agents/db-architect.agent.md` | Firestore schema design       |

To explicitly use an agent: `@Backend Developer add endpoint for...`

---

## Skills (On-Demand Context)

Skills are deep-reference docs loaded when the Orchestrator decides they're relevant.
You can also reference them directly:

| Skill                        | When to reference                           |
| ---------------------------- | ------------------------------------------- |
| `feature-scaffolding.md`     | Scaffolding a new feature module            |
| `backend-feature-pattern.md` | Backend route/controller/service patterns   |
| `react-feature-module.md`    | Frontend feature module patterns            |
| `react-component-pattern.md` | React component and hook patterns           |
| `code-reuse-guidelines.md`   | Finding reusable code in `shared/`          |
| `firebase-auth.md`           | Auth middleware, guards, token verification |
| `firestore-patterns.md`      | Firestore queries, transactions, converters |
| `vnpay-integration.md`       | VNPay payment flow                          |
| `web-research.md`            | Researching external libraries or APIs      |

---

## Playbooks (Always Loaded)

Playbooks are long-term architectural knowledge that Copilot always has access to:

| Playbook                        | Content                           |
| ------------------------------- | --------------------------------- |
| `01-project-structure.md`       | Where every file lives            |
| `02-architecture-decisions.md`  | Tech choices and why              |
| `03-shared-code-guidelines.md`  | What to reuse from `shared/`      |
| `04-refactoring-playbook.md`    | How to refactor safely            |
| `05-api-design-principles.md`   | REST conventions, response shapes |
| `06-firebase-best-practices.md` | Firestore query patterns          |

---

## Rules (Enforced)

Copilot is instructed to always comply with these rules:

| Rule file                    | Enforces                                                  |
| ---------------------------- | --------------------------------------------------------- |
| `coding-standards.rule.md`   | AppError, logger, thin controllers, no useEffect fetching |
| `typescript.rule.md`         | No `any`, explicit return types, enum patterns            |
| `naming-conventions.rule.md` | File names, variable cases, route patterns                |
| `folder-structure.rule.md`   | Where files go, no cross-feature imports                  |

---

## Stack Quick Reference

|                | Backend                    | Frontend              |
| -------------- | -------------------------- | --------------------- |
| Language       | TypeScript 5.9             | TypeScript 5          |
| Framework      | Express 4                  | React 19 + Vite 6     |
| Database       | Firestore (Firebase Admin) | —                     |
| Auth           | Firebase Auth ID tokens    | Firebase Auth         |
| Validation     | Zod v4 (DTOs)              | Zod v4 (forms)        |
| HTTP           | —                          | Axios (service layer) |
| Server state   | —                          | TanStack Query v5     |
| Forms          | —                          | React Hook Form v7    |
| Routing        | Express Router             | React Router DOM v7   |
| Styling        | —                          | Bootstrap 5 + SCSS    |
| Error handling | AppError → global handler  | —                     |
| Logging        | Winston                    | —                     |

---

## Contact

For questions about the Copilot setup: raise an issue or ask in the team chat.
