---
agent: agent
description: Scaffold a complete full-stack feature for shop-agentic (backend module + frontend module)
---

# New Feature Prompt

Use this prompt template to request a new full-stack feature.

---

## Instructions for Copilot

Before writing code, perform these steps in order:

1. Read `.github/playbooks/01-project-structure.md` — understand file locations.
2. Read `.github/playbooks/03-shared-code-guidelines.md` — identify reusable code.
3. Read `.github/skills/feature-scaffolding.md` — follow the scaffold pattern.
4. Read `.github/skills/backend-feature-pattern.md` for backend layer.
5. Read `.github/skills/react-feature-module.md` for frontend layer.

Then implement:

- **Backend**: full feature module under `shop-agentic-backend/src/features/<name>/`
- **Frontend**: full feature module under `shop-agentic-frontend/src/features/<name>/`

---

## Feature Request Template

```
Feature name: <name>

Description:
<What this feature does, from the user's perspective>

Backend requirements:
- Endpoints needed: <list GET/POST/PATCH/DELETE endpoints>
- Firestore collections: <collections involved>
- Auth required: <yes/no; which endpoints>
- Business rules: <conditions, validations, constraints>

Frontend requirements:
- Pages: <list pages and their routes>
- Components: <notable UI components>
- Forms: <forms and their fields>
- Queries/mutations: <what data is fetched/mutated>

Out of scope (this PR):
- <anything explicitly NOT included>
```

---

## Example Usage

```
Feature name: discount-codes

Description:
Allow admins to create discount codes that users can apply at checkout to reduce order totals.

Backend requirements:
- POST /discount-codes (admin only) — create a discount code
- GET /discount-codes (admin only) — list all discount codes
- POST /discount-codes/validate — check if a code is valid (authenticated users)
- Firestore collections: discountCodes
- Auth required: all endpoints
- Business rules:
  - Codes are alphanumeric, 6–20 chars, unique
  - Codes have a percentage or fixed discount
  - Codes can have a max usage count (null = unlimited)
  - Codes expire by date (null = never)
  - Codes can be active/inactive

Frontend requirements:
- Pages: /admin/discount-codes (list + create form)
- Components: DiscountCodeTable, CreateDiscountCodeModal
- Forms: CreateDiscountCodeForm (code, type, value, maxUses, expiresAt)
- Queries/mutations: useDiscountCodes, useCreateDiscountCode, useValidateDiscountCode

Out of scope:
- Editing / deleting discount codes
- Per-user usage tracking
```
