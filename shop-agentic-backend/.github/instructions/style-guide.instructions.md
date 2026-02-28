---
description: Project-wide coding standards for shop-agentic-backend. Always apply to every code generation, refactoring, or review.
---

# shop-agentic-backend – AI Coding Instructions (bắt buộc phải tuân thủ 100%)

## 1. Project Context (luôn nhớ)

- Node.js + Express + Firebase Admin + TypeScript
- Cấu trúc **Feature-Sliced Design** giống hệt frontend:
  - `src/app/` → core (server, app, database, config)
  - `src/features/[feature-name]/` → mọi thứ của 1 feature
  - `src/shared/` → middleware, utils, exceptions, common services
- Mục tiêu: scale dễ dàng đến 50+ features, type-safe, production-grade
- Hiện đang migrate từ cấu trúc cũ (controllers/, routes/ ở root) sang Feature-Sliced

## 2. Packages & Dependencies (bắt buộc)

**Dependencies chính (phải có):**

- `express`, `firebase-admin`, `cors`, `dotenv`
- `zod` (validation – đồng bộ 100% với frontend)
- `helmet`, `compression`, `express-rate-limit`
- `winston` (logging)
- `express-async-errors`
- `multer` (nếu có upload file)

**Dev Dependencies:**

- `typescript`, `@types/express`, `@types/node`, `ts-node-dev`, `nodemon`, `jest`, `supertest`

**Không được dùng:**

- `body-parser` (Express 4.16+ đã có sẵn)
- `morgan` (thay bằng Winston)
- Bất kỳ package nào không nằm trong danh sách trên mà không hỏi trước

## 3. Quy tắc cứng – VI PHẠM LÀ SAI

### A. Feature Structure (bắt buộc)

Mỗi feature phải có đúng cấu trúc:

```
features/[feature]/
├── controllers/
├── services/
├── routes/
├── dtos/           ← Zod schemas (CreateEventDto, EventResponseDto...)
├── types/
├── constants/
└── index.ts        ← export router
```

### B. Shared Layer

- Toàn bộ middleware → `src/shared/middleware/`
- Common services (firebase, email, storage…) → `src/shared/services/`
- Custom errors → `src/shared/exceptions/`
- Utils → `src/shared/utils/`

### C. Code Organization

- **Controller**: chỉ parse request, gọi service, trả response (không viết business logic)
- **Service**: chứa toàn bộ business logic + gọi Firebase / DB
- **DTO**: dùng Zod schema để validate request/response
- **Route**: chỉ mount controller, không có logic

### D. API Design & Error Response

- RESTful chuẩn: `/api/v1/events`, `/api/v1/events/:id`
- Response luôn có format:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Success"
  }
  ```
- Error: dùng `AppError` class từ `shared/exceptions`
  ```json
  {
    "success": false,
    "error": "VALIDATION_ERROR",
    "message": "...",
    "details": { ... }
  }
  ```

### E. TypeScript & Zod

- Luôn dùng TypeScript (.ts)
- Validation bắt buộc dùng Zod (không viết thủ công)
- `z.infer<typeof schema>` để lấy type
- Không dùng `any` trừ trường hợp thật sự cần

### F. Security & Performance

- Luôn dùng `helmet()`, `cors()`, `rateLimit()`, `compression()`
- Auth middleware từ `shared/middleware/auth.ts`
- Rate limit mặc định 100 requests / 15 phút

### G. Logging

- Sử dụng Winston ở mọi nơi
- Log level: error, warn, info, http, debug

## 4. Entry Point

- `src/main.ts` là file chạy chính
- `src/app/app.ts` mount tất cả routes từ features
- Ví dụ:
  ```ts
  app.use("/api/v1/events", eventRoutes);
  app.use("/api/v1/auth", authRoutes);
  ```

## 5. Khi AI được yêu cầu refactor hoặc tạo mới

1. Phân tích feature hiện tại
2. Tách đúng vào `src/features/[feature]/` theo cấu trúc
3. Mount route trong `src/app/app.ts`
4. Output theo format rõ ràng:
   ````
   === FILE: src/features/event/routes/event.routes.ts
   ```ts
   ...
   ````
5. Cuối cùng đưa Summary + cách mount route + packages cần thêm (nếu có)

## 6. Các quy tắc nhỏ khác

- Import alias: `@/` = src/ (cấu hình trong tsconfig.json)
- Async/await + try/catch với `express-async-errors`
- Environment variables dùng `dotenv` + `config.ts`
- Không để logic business trong route hoặc controller
- Comment bằng tiếng Việt được phép nếu cần giải thích business

## 8. Auth & User Management

- Firebase Auth chỉ dùng để verify identity (`idToken`)
- Toàn bộ profile user phải lưu trong DB riêng (User collection/model)
- Luôn dùng pattern Find-or-Create (upsert) cho Google Login
- Không lưu toàn bộ user data chỉ trong Firebase Auth
- Session token do backend trả về và backend quản lý

**Bất kỳ output nào vi phạm một trong các quy tắc trên đều là SAI.**  
Hãy luôn hỏi lại nếu không chắc chắn về feature hoặc package.

---
