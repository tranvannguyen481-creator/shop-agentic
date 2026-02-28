# Playbook 04 — Refactoring Playbook

> Use this when asked to refactor existing code. Follow all steps in order.

---

## Step 1 — Understand Before Changing

1. Read the file(s) to be refactored fully before writing a single line.
2. Identify the **intent** of the code — what problem it solves.
3. List every caller / consumer of the code (use `list_code_usages`).
4. Confirm the scope: is this a rename, extract, restructure, or performance refactor?

---

## Step 2 — Plan the Change

State explicitly (in a comment or response):

- What files will be **modified**
- What files will be **created**
- What files will be **deleted**
- What callers will need **updating**

Do not proceed without this plan.

---

## Step 3 — Refactoring Rules

### Do

- ✅ Keep the public API identical unless the refactor specifically changes it
- ✅ Extract complex logic into well-named private helper functions
- ✅ Replace magic strings/numbers with named constants in `constants/`
- ✅ Tighten TypeScript types — remove `any`, add generics where appropriate
- ✅ Remove dead code (unreachable branches, unused imports)
- ✅ Add missing Zod validation on inputs that lacked it

### Do NOT

- ❌ Change business logic silently while "refactoring"
- ❌ Introduce new dependencies to solve a refactoring problem
- ❌ Merge unrelated changes into the same refactor
- ❌ Remove error handling without a documented reason
- ❌ Rename public API methods without updating all usages

---

## Step 4 — Backend Refactoring Checklist

```
[ ] All business logic is in the service layer (not controller, not route)
[ ] Controller functions are ≤ 15 lines and call only services + send response
[ ] Every Firestore query uses firestore.utils.ts helpers
[ ] All thrown errors use AppError
[ ] Winston logger (not console.log) used throughout
[ ] Zod DTO validates every external input
[ ] Types are exported from types/ (not inline in service)
```

---

## Step 5 — Frontend Refactoring Checklist

```
[ ] No data fetching in useEffect — all via React Query hooks
[ ] API calls are in services/ not inside components or hooks
[ ] Form state uses React Hook Form + Zod resolver
[ ] No raw axios in component files
[ ] Props interfaces are typed (not inlined as any)
[ ] Shared components extracted to shared/components/ if used in 2+ places
[ ] Error boundaries / loading states handled consistently
```

---

## Step 6 — After Refactoring

1. Run TypeScript compiler (`tsc --noEmit`) — zero errors required.
2. Verify no broken imports.
3. Check that all callers still compile.
4. If tests exist, confirm they still pass.
5. Report what changed, concisely.
