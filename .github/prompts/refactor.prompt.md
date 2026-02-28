---
agent: agent
description: Refactor existing code following shop-agentic standards
---

# Refactor Prompt

Use this prompt to request a targeted code refactor.

---

## Instructions for Copilot

Before writing code, perform these steps in order:

1. Read `.github/playbooks/04-refactoring-playbook.md` — follow every step.
2. Read `.github/rules/coding-standards.rule.md` — enforce all rules.
3. Read `.github/rules/typescript.rule.md` — enforce TypeScript standards.
4. Read `.github/playbooks/03-shared-code-guidelines.md` — identify shared utilities to use.

**Do not change business logic** unless explicitly requested.
**State your plan before writing code.**

---

## Refactor Request Template

```
Target file(s):
<paths relative to repo root>

Refactor type:
[ ] Extract logic to service layer
[ ] Tighten TypeScript types / remove `any`
[ ] Replace console.log with logger
[ ] Replace useEffect fetching with React Query
[ ] Replace raw axios with service function
[ ] Extract reusable component/hook to shared/
[ ] Other: <describe>

Current problem:
<Describe what is wrong or messy about the current code>

Expected outcome:
<Describe what the code should look like / do after refactoring>

Constraints (must not change):
<List any behaviors, APIs, or outputs that must stay identical>
```

---

## Example Usage

```
Target file(s):
shop-agentic-backend/src/features/order/controllers/order.controller.ts

Refactor type:
[x] Extract logic to service layer

Current problem:
The controller contains Firestore queries and business logic for
checking ticket availability and calculating totals. It's 120 lines long.

Expected outcome:
Controller should be < 20 lines. All Firestore logic moves to
order.service.ts. Controller only parses the DTO, calls the service,
and sends the response.

Constraints (must not change):
- API response shape must stay identical
- Same HTTP status codes for all outcomes
- Existing DTO validation must remain
```
