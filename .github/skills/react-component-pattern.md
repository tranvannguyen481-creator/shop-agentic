# Skill: React Component Pattern

> **Load this skill** before creating any new React component, hook, or form in `shop-agentic-frontend/`.
> Supplements `react-feature-module.md` with finer-grained patterns for individual components.

---

## Component Decision Tree

Before creating a new component, answer:

```
Is this component used in more than one feature?
  YES → create in src/shared/components/ui/ or src/shared/components/form/
  NO  → Is it a full page (route level)?
          YES → src/features/{feature}/pages/
          NO  → src/features/{feature}/components/
```

Before creating a new hook, answer:

```
Does this hook work with server state (API calls)?
  YES → src/features/{feature}/hooks/use{Feature}.ts  (React Query)
  NO  → Is it reusable across features?
          YES → src/shared/hooks/use{Name}.ts
          NO  → src/features/{feature}/hooks/use{Name}.ts
```

---

## Template: Feature Component

```tsx
// src/features/discount-code/components/DiscountCodeCard.tsx
import type { DiscountCode } from "../types/discount-code.types";

interface DiscountCodeCardProps {
  code: DiscountCode;
  onDelete?: (id: string) => void;
}

export function DiscountCodeCard({ code, onDelete }: DiscountCodeCardProps) {
  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body d-flex justify-content-between align-items-center">
        <div>
          <span className="badge bg-primary me-2">{code.code}</span>
          <span className="text-muted">{code.discountPercent}% off</span>
        </div>
        {onDelete && (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => onDelete(code.id)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Template: React Query Hook

```ts
// src/features/discount-code/hooks/useDiscountCode.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { discountCodeService } from "../services/discount-code.service";
import type { CreateDiscountCodeInput } from "../types/discount-code.types";

// Query keys — always define as constants to avoid typos
const QK = {
  list: ["discount-codes"] as const,
  detail: (id: string) => ["discount-codes", id] as const,
};

export function useDiscountCodes() {
  return useQuery({
    queryKey: QK.list,
    queryFn: () => discountCodeService.list(),
  });
}

export function useDiscountCode(id: string) {
  return useQuery({
    queryKey: QK.detail(id),
    queryFn: () => discountCodeService.getById(id),
    enabled: !!id,
  });
}

export function useCreateDiscountCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDiscountCodeInput) =>
      discountCodeService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.list });
    },
  });
}

export function useDeleteDiscountCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discountCodeService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.list });
    },
  });
}
```

---

## Template: Form with React Hook Form + Zod

```tsx
// src/features/discount-code/components/CreateDiscountCodeForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateDiscountCode } from "../hooks/useDiscountCode";

// Schema defined close to the form that uses it (or import from schemas/)
const schema = z.object({
  code: z.string().min(3).max(20),
  discountPercent: z.number().int().min(1).max(100),
  expiresAt: z.string().datetime(),
});
type FormValues = z.infer<typeof schema>;

export function CreateDiscountCodeForm() {
  const { mutate, isPending } = useCreateDiscountCode();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormValues) {
    mutate(values, { onSuccess: () => reset() });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="mb-3">
        <label className="form-label">Code</label>
        <input
          {...register("code")}
          className={`form-control ${errors.code ? "is-invalid" : ""}`}
        />
        {errors.code && (
          <div className="invalid-feedback">{errors.code.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">Discount %</label>
        <input
          type="number"
          {...register("discountPercent", { valueAsNumber: true })}
          className={`form-control ${errors.discountPercent ? "is-invalid" : ""}`}
        />
        {errors.discountPercent && (
          <div className="invalid-feedback">
            {errors.discountPercent.message}
          </div>
        )}
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? "Creating…" : "Create Code"}
      </button>
    </form>
  );
}
```

---

## Template: Page Component

```tsx
// src/features/discount-code/pages/DiscountCodesPage.tsx
import { AuthGuard } from "@/shared/guards";
import {
  useDiscountCodes,
  useDeleteDiscountCode,
} from "../hooks/useDiscountCode";
import { DiscountCodeCard } from "../components/DiscountCodeCard";
import { CreateDiscountCodeForm } from "../components/CreateDiscountCodeForm";

export function DiscountCodesPage() {
  const { data: codes, isLoading } = useDiscountCodes();
  const { mutate: deleteCode } = useDeleteDiscountCode();

  if (isLoading) return <div className="spinner-border" role="status" />;

  return (
    <AuthGuard>
      <div className="container py-4">
        <h1 className="h3 mb-4">Discount Codes</h1>
        <CreateDiscountCodeForm />
        <hr />
        {codes?.map((c) => (
          <DiscountCodeCard key={c.id} code={c} onDelete={deleteCode} />
        ))}
      </div>
    </AuthGuard>
  );
}
```

---

## Template: Register Route

```tsx
// src/app/file-based-routes.tsx — add inside the routes array
{
  path: "/discount-codes",
  element: <DiscountCodesPage />,
},
```

```ts
// src/app/route-config.tsx — add to nav config if this page appears in navigation
{ path: "/discount-codes", label: "Discount Codes", icon: TagIcon },
```

---

## Rules Recap

| Rule            | Correct                       | Wrong                             |
| --------------- | ----------------------------- | --------------------------------- |
| Server data     | `useQuery` / `useMutation`    | `useState` + `useEffect`          |
| HTTP calls      | `featureService.method()`     | `axios.get()` in component        |
| Forms           | RHF + Zod resolver            | Controlled `useState`             |
| Protected pages | wrap with `<AuthGuard>`       | inline `if (!user) navigate(...)` |
| Types           | explicit `interface` / `type` | `any`, `object`                   |
| Styles          | Bootstrap utility classes     | inline `style={{}}`               |
