---
agent: agent
description: Full code review against shop-agentic standards
---

# Full Code Review Prompt

Use this prompt to request a thorough review of changed or new code.

---

## Instructions for Copilot

Perform a detailed code review against all project standards. Load these references:

1. `.github/rules/coding-standards.rule.md`
2. `.github/rules/typescript.rule.md`
3. `.github/rules/naming-conventions.rule.md`
4. `.github/rules/folder-structure.rule.md`
5. `.github/playbooks/02-architecture-decisions.md`
6. `.github/playbooks/05-api-design-principles.md` (if reviewing backend)

---

## Review Checklist

For each file reviewed, check:

### TypeScript

- [ ] No `any` types
- [ ] All exported functions have explicit return types
- [ ] Proper use of `unknown` for error catching
- [ ] No suppressed TypeScript errors

### Backend Specific

- [ ] Controllers are thin (≤ 15 lines of logic)
- [ ] All errors thrown via `AppError`
- [ ] No `console.log` — only `logger`
- [ ] All external inputs validated with Zod DTO
- [ ] Firestore queries use `withConverter`
- [ ] All timestamps use `toTimestamp` / `fromTimestamp`
- [ ] Auth middleware applied on all protected routes
- [ ] No cross-feature imports

### Frontend Specific

- [ ] No `useEffect` for data fetching
- [ ] No raw `axios` in components
- [ ] All forms use React Hook Form + Zod resolver
- [ ] API calls isolated in `services/`
- [ ] Components receive data via props or hooks, not direct service calls
- [ ] Route guard applied correctly in `file-based-routes.tsx`

### Naming & Structure

- [ ] File names match `naming-conventions.rule.md`
- [ ] Files are in the correct folder per `folder-structure.rule.md`
- [ ] No feature-specific code in `shared/`

### Architecture

- [ ] No new dependencies added without justification
- [ ] API response shape follows standard envelope
- [ ] HTTP status codes are correct

---

## Review Request Template

```
Files to review:
<list file paths or describe the PR / feature>

Context:
<Brief description of what the code does>

Focus areas (optional):
<Anything specific to look at — auth, performance, Firestore queries, etc.>
```

---

## Output Format

Provide the review as:

```
## Summary
<One paragraph on overall quality>

## Critical Issues (must fix before merge)
- [file:line] Issue description + fix suggestion

## Warnings (should fix)
- [file:line] Issue description + fix suggestion

## Suggestions (optional improvements)
- [file:line] Suggestion

## Verdict
[ ] APPROVE   [ ] REQUEST CHANGES
```
