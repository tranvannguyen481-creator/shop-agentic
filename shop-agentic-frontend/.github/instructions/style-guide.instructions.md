---
description: Project-wide coding standards for shop-agentic-frontend. Always apply to every code generation, refactoring, or review.
---

# shop-agentic-frontend – AI Coding Instructions (bắt buộc phải tuân thủ 100%)

## 1. Project Context (luôn nhớ)

- React 19 + TypeScript 4.9 + React Hook Form 7.71 + Zod 4.3 + Bootstrap 5 + **TanStack Query v5** + axios
- **Không dùng Redux / redux-thunk / reselect** – đã loại bỏ hoàn toàn
- Cấu trúc Feature-Sliced Design nghiêm ngặt:
  - `src/features/[feature-name]/` (auth, event, user, group…)
    - `pages/` → chỉ chứa thin page/view components
    - `schemas/` → Zod schemas (tên file: \*-schema.ts)
    - `types/` → interfaces/types (z.infer từ Zod schema)
    - `constants/` → constants, options, enums
    - `hooks/` → custom hooks (use[Name]Form.ts, use[Name]Submit.ts, use[Name]Query.ts…)
    - `utils/` → pure functions
    - `components/` → feature-specific components (nếu không reuse được)
    - `services/` → API call functions (axios, không có logic)
  - `src/shared/components/`
    - `form/` → useSmartForm, FormError, form-utils (đã có sẵn)
    - `ui/` → UI Kit (Input, Button, SectionCard, Modal, UploadField…)
  - `src/shared/services/` → axios instances, base API utilities
  - `src/shared/query-client.ts` → QueryClient singleton
- Không bao giờ lưu form state vào TanStack Query cache

## 2. Quy tắc cứng – VI PHẠM LÀ SAI (AI không được làm)

### A. Component .tsx CHỈ LÀ VIEW THUẦN (Presentation Layer)

- Không được chứa:
  - Type / Interface
  - Zod schema
  - Constants
  - useState, useEffect, useForm, register, handleSubmit
  - useQuery, useMutation, queryClient trực tiếp
  - Logic business
- Chỉ được:
  - Nhận props (hoặc gọi hook riêng)
  - Render JSX + Bootstrap classes
  - Gọi `<FormError error={...} />` và components từ `shared/components/ui/`

### B. Tách code bắt buộc khi refactor hoặc tạo mới

Mọi form/component phải tách thành:

- `features/[feature]/schemas/[name]-schema.ts`
- `features/[feature]/types/[name].ts`
- `features/[feature]/constants/[name]-constants.ts`
- `features/[feature]/hooks/use-[name]-form.ts` ← luôn import và dùng `useSmartForm` từ shared
- `features/[feature]/hooks/use-[name]-submit.ts` ← xử lý onSubmit + gọi mutation
- `features/[feature]/hooks/use-[name]-query.ts` ← wrap `useQuery` / `useInfiniteQuery`
- `features/[feature]/services/[name]-api.ts` ← axios API functions thuần (không có hook)
- `features/[feature]/pages/[name]-page.tsx` ← thin wrapper

### C. Form – Phải dùng shared logic

- Luôn import: `import { useSmartForm } from '@/shared/components/form';`
- Luôn dùng: `form.handleSmartSubmit(onSubmit)`
- Luôn render error bằng: `<FormError error={form.formState.errors.xxx} />`
- Input class: `form-control ${error ? 'is-invalid' : ''}`
- Không được viết lại `scrollToFirstError`, `onInvalid`, `shouldFocusError` bên trong component

### D. UI Kit – Bắt buộc reuse

- Button → `<Button variant="primary" ... />` từ `shared/components/ui`
- Input, Select, Modal, Card… → luôn từ `shared/components/ui`
- Không được viết `<button className="btn btn-primary">` trực tiếp trong feature (trừ trường hợp cực đặc biệt)

### E. TanStack Query – Quy tắc cứng

- **Query** (`useQuery`, `useInfiniteQuery`) → luôn đặt trong hook riêng: `use-[name]-query.ts`
- **Mutation** (`useMutation`) → đặt trong `use-[name]-submit.ts` hoặc `use-[name]-mutation.ts`
- **queryKey** phải dùng constant array, đặt trong `constants/[name]-constants.ts`:
  ```ts
  export const EVENT_QUERY_KEYS = {
    all: ["events"] as const,
    detail: (id: string) => ["events", id] as const,
  };
  ```
- `queryClient.invalidateQueries` sau mutation thành công → gọi trong `onSuccess` của `useMutation`
- Server error từ mutation → dùng `mergeServerErrors(form, serverErrors)` từ shared
- **Không được** gọi `useQuery` / `useMutation` trực tiếp trong component page
- **Không được** import `queryClient` trực tiếp từ bên trong component; dùng `useQueryClient()` hook
- `staleTime` mặc định 30s (đã set ở `query-client.ts`); override trong từng query nếu cần

### F. Tên file & folder

- Schema: `create-event-schema.ts`
- Hook form: `use-create-event-form.ts`
- Page: `create-event-page.tsx` (chỉ import và render)

## 3. Khi AI được yêu cầu refactor hoặc tạo component mới

1. Phân tích cấu trúc hiện tại của feature đó
2. Tách thành đúng các file như mục 2.B
3. Không viết logic trực tiếp trong page component

## 4. UI & Responsive Design + Windows Display Scaling (BẮT BUỘC)

**Màn hình dev chính:** 2560×1600 @ **200% scale** (logical resolution ~1280×800)
AI phải thiết kế sao cho UI đẹp hoàn hảo ở scale này và **tự động scale tốt** trên mọi thiết bị khác:

- 100% scale (4K, 1440p, 1080p)
- 125%, 150%, 175%, 225%, 250%, 300% scale (Windows phổ biến)
- Mobile / Tablet / Laptop / Desktop / Ultra-wide

**Quy tắc cứng về Responsive:**

1. **Mobile-first 100%** (Bootstrap 5 default)
   - Bắt đầu code cho xs (<576px)
   - Sau đó dùng `sm`, `md`, `lg`, `xl`, `xxl`

2. **Breakpoints phải dùng đúng Bootstrap 5**
   ```
   xs  < 576px
   sm  >= 576px
   md  >= 768px
   lg  >= 992px
   xl  >= 1200px
   xxl >= 1400px
   ```

## 5. UI Design Principles – 10 Nguyên tắc Vàng (BẮT BUỘC)

Mọi component và page UI phải tuân thủ đồng thời 10 nguyên tắc sau:

1. Visual Hierarchy
2. Gestalt (Proximity, Similarity)
3. Fitts's Law
4. Hick's Law
5. Consistency
6. Feedback & System Status
7. Simplicity (Less is More)
8. Accessibility (WCAG 2.2)
9. Responsive + Windows Scaling
10. Atomic Design / Component-Driven

### Quy tắc áp dụng bắt buộc khi AI generate/refactor UI

- Luôn ưu tiên giảm nhiễu thị giác: dẫn mắt theo thứ tự Title → Key Info → Action.
- Nhóm thông tin theo Gestalt; không tách rời các khối liên quan về mặt ngữ nghĩa.
- Clickable target tối thiểu 44x44px cho control chính.
- Không thêm lựa chọn thừa ở step/form đang xử lý.
- Chỉ dùng shared UI kit trong `src/shared/components/ui`.
- Luôn có feedback trạng thái (loading/disabled/status text) cho hành động quan trọng.
- Loại bỏ text placeholder/đúp/không mang giá trị.
- Đảm bảo tương phản đạt WCAG (4.5:1 text thường, 3:1 text lớn).
- Bắt buộc mobile-first + Bootstrap breakpoints đúng chuẩn.
- Ưu tiên component-driven; tránh lặp lại UI pattern giữa các page.

### Checklist bắt buộc trước khi hoàn tất UI task

- AI phải tự kiểm tra 10 nguyên tắc trên và chỉ được kết thúc khi không vi phạm nguyên tắc cứng.

## 6. State Management – TanStack Query + Context (BẮT BUỘC)

### 6.1. Quy tắc phân loại state

| Loại state                                    | Nơi quản lý                                                    |
| --------------------------------------------- | -------------------------------------------------------------- |
| **Server state** (fetch, cache, sync)         | TanStack Query (`useQuery`, `useInfiniteQuery`, `useMutation`) |
| **UI glue state** (modal, toast, wizard step) | React Context (`src/shared/contexts/`)                         |
| **Form state**                                | React Hook Form (local, không ra ngoài)                        |
| **Ephemeral local UI** (toggle, tab)          | `useState` trong hook riêng                                    |

### 6.2. TanStack Query – Patterns bắt buộc

```ts
// services/event-api.ts  ← axios thuần, không hook
export const fetchEventDetail = (id: string) =>
  api.get<ApiResponse<Event>>(`/events/${id}`).then((r) => r.data.data);

// hooks/use-event-detail-query.ts  ← wrap useQuery
export const useEventDetailQuery = (id: string) =>
  useQuery({
    queryKey: EVENT_QUERY_KEYS.detail(id),
    queryFn: () => fetchEventDetail(id),
    enabled: !!id,
  });

// hooks/use-create-event-submit.ts  ← wrap useMutation
export const useCreateEventSubmit = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.all }),
  });
};
```

### 6.3. Quy tắc cấm

- **Không dùng Redux / redux-thunk / reselect / react-redux** – cấm hoàn toàn.
- Không dùng Context như "mini-Redux" hay lưu server data vào Context.
- Không tạo Context trong feature folders; chỉ đặt trong `src/shared/contexts/`.
- Không gọi `useQuery` / `useMutation` trực tiếp trong component page.
- Không import `queryClient` singleton trực tiếp trong component; dùng `useQueryClient()`.

### 6.4. Cấu trúc provider bắt buộc (`src/index.tsx`)

```tsx
<QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</QueryClientProvider>
```

Context providers đặt bên trong `<App>` theo thứ tự: Theme → Modal → Toast → Wizard → Routes.

### 6.5. Chuẩn thư mục Context

```text
src/shared/contexts/
├── index.ts
├── types.ts
├── ThemeContext.tsx
├── ModalContext.tsx
├── ToastContext.tsx
└── WizardContext.tsx
```

### 6.6. Best Practices hiệu năng

- `staleTime` mặc định 30s; set cao hơn (vd `5 * 60_000`) với dữ liệu ít thay đổi.
- Dùng `select` option trong `useQuery` để transform/slice data, tránh re-render thừa.
- `placeholderData: keepPreviousData` cho pagination để tránh flash loading.
- Prefetch với `queryClient.prefetchQuery` trong event handler trước khi navigate.

## 7. Routing & Route Protection

- Chỉ 3 route public: `/` (landing), `/sign-in`, `/sign-up`
- Tất cả route còn lại là protected
- Sử dụng `ProtectedRoute` và `PublicRoute` từ `src/shared/guards`
- `ProtectedRoute` phải có loading state + redirect với `state={{ from: location }}`
- `PublicRoute` tự động redirect về `/home` nếu đã login
- Không viết logic auth trực tiếp trong page component
