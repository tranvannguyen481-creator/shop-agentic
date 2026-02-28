# Playbook: React Feature Module

> Read this file before creating any new frontend feature.

## Complete File Checklist for a New Feature

For a feature named `payment`:

```
src/features/payment/
├── pages/
│   └── PaymentPage.tsx          ← route component
├── components/
│   └── PaymentForm.tsx          ← UI components
├── hooks/
│   └── usePayment.ts            ← React Query hooks
├── services/
│   └── payment.service.ts       ← axios calls (no axios in components)
├── schemas/
│   └── payment.schema.ts        ← Zod schemas
├── types/
│   └── payment.types.ts         ← interfaces matching backend DTOs
└── constants/
    └── payment.constants.ts
```

Register the route in `src/app/file-based-routes.tsx` and `src/app/route-config.tsx`.

## Service Function Template

```ts
// src/features/payment/services/payment.service.ts
import api from "@/shared/services/api";
import type { CreatePaymentDto, PaymentResponse } from "../types/payment.types";

export const paymentService = {
  createPaymentUrl: (data: CreatePaymentDto): Promise<PaymentResponse> =>
    api
      .post<PaymentResponse>("/payment/vnpay/create-url", data)
      .then((r) => r.data),

  getPaymentStatus: (txnRef: string): Promise<PaymentResponse> =>
    api.get<PaymentResponse>(`/payment/${txnRef}`).then((r) => r.data),
};
```

## React Query Hook Template

```ts
// src/features/payment/hooks/usePayment.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { paymentService } from "../services/payment.service";
import type { CreatePaymentDto } from "../types/payment.types";

export function useCreatePaymentUrl() {
  return useMutation({
    mutationFn: (data: CreatePaymentDto) =>
      paymentService.createPaymentUrl(data),
  });
}

export function usePaymentStatus(txnRef: string) {
  return useQuery({
    queryKey: ["payment", txnRef],
    queryFn: () => paymentService.getPaymentStatus(txnRef),
    enabled: !!txnRef,
  });
}
```

## Form + Zod Template

```ts
// schemas/payment.schema.ts
import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  amount: z.number().int().positive("Amount must be positive"),
  bankCode: z.string().optional(),
});

export type CreatePaymentFormValues = z.infer<typeof createPaymentSchema>;
```

```tsx
// components/PaymentForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPaymentSchema,
  type CreatePaymentFormValues,
} from "../schemas/payment.schema";
import { useCreatePaymentUrl } from "../hooks/usePayment";

export function PaymentForm({ orderId }: { orderId: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePaymentFormValues>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: { orderId },
  });
  const { mutate, isPending } = useCreatePaymentUrl();

  const onSubmit = (data: CreatePaymentFormValues) => {
    mutate(data, {
      onSuccess: ({ paymentUrl }) => {
        window.location.href = paymentUrl;
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* fields */}
      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}
```

## Mandatory Rules

- `types/` interfaces must be derived from backend DTOs — copy field names exactly.
- Never use `useEffect` to fetch data — use `useQuery`.
- Form schemas go in `schemas/` — never inline Zod in a component.
- Always handle `isPending`, `isError` states in pages (show spinner / error message).
- Use Bootstrap classes (`btn`, `form-control`, `alert`, etc.) before writing custom SCSS.
- Export everything from `index.ts` at the feature root only if the feature is consumed outside of itself.
