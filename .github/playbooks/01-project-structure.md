# Playbook 01 — Project Structure

> This playbook is **always loaded** by every agent before implementing any feature.
> It is the single source of truth for where code lives.

---

## Monorepo Layout

```
shop-agentic/
├── shop-agentic-backend/   # Express 4 + TypeScript 5.9 + Firebase Admin
└── shop-agentic-frontend/  # React 19 + Vite 6 + TypeScript 5
```

---

## Backend Structure (`shop-agentic-backend/src/`)

```
src/
├── main.ts                        # Entry point — bootstraps Express app
├── app/
│   ├── app.ts                     # Register middleware, routes, error handler
│   ├── config/
│   │   └── firebaseAdmin.ts       # Firebase Admin SDK initialization
│   └── middleware/
│       ├── error-handler.ts       # Global error handler (uses AppError)
│       └── request-logger.ts      # HTTP request logging (winston)
├── features/
│   ├── auth/                      # Authentication & user identity
│   ├── event/                     # Events & ticketing
│   ├── group/                     # Group management
│   ├── notification/              # Push / in-app notifications
│   ├── order/                     # Order lifecycle & payments
│   ├── test/                      # Internal test/debug endpoints
│   └── upload/                    # File upload (images to /public/images)
└── shared/
    ├── exceptions/
    │   └── AppError.ts            # Custom error class — always throw this
    ├── middleware/
    │   ├── auth.ts                # Firebase ID-token verification middleware
    │   └── upload.ts              # Multer upload middleware
    └── utils/
        ├── assert-actor.ts        # Utility to assert authenticated user
        ├── firestore.utils.ts     # Firestore helpers (converter, timestamps)
        └── logger.ts              # Winston logger instance
```

### Feature Module Structure (every feature follows this exactly)

```
features/<name>/
├── index.ts              # Re-exports routes + module bootstrap
├── constants/            # Enums, Firestore collection names, magic strings
├── controllers/          # Thin HTTP handlers — delegate to services
├── dtos/                 # Zod schemas for request validation
├── routes/               # Express Router — binds paths to controllers
├── services/             # Business logic — queries Firestore
└── types/                # TypeScript interfaces & types for this feature
```

---

## Frontend Structure (`shop-agentic-frontend/src/`)

```
src/
├── index.tsx                      # React DOM root
├── app/
│   ├── app.tsx                    # Root component (QueryClientProvider, Router)
│   ├── file-based-routes.tsx      # Central route registry (React Router DOM v7)
│   ├── not-found-page.tsx         # 404 fallback
│   └── route-config.tsx           # Route constants / guard wrappers
├── features/
│   ├── auth/                      # Login, register, token management
│   ├── event/                     # Event listing, detail, purchase flow
│   ├── group/                     # Group pages
│   ├── home/                      # Home/dashboard page
│   ├── landing/                   # Public landing page
│   ├── test/                      # Test / debug pages
│   └── user/                      # User profile pages
└── shared/
    ├── query-client.ts            # TanStack Query client singleton
    ├── components/                # Reusable UI components
    ├── contexts/                  # React contexts (AuthContext, etc.)
    ├── guards/                    # Route guards (RequireAuth, RequireRole)
    ├── hooks/                     # Generic hooks
    ├── layouts/                   # Page layout wrappers
    ├── services/                  # Shared API service functions (axios)
    ├── styles/                    # Global SCSS and Bootstrap customization
    └── utils/                     # Pure utility functions
```

### Feature Module Structure (every frontend feature follows this exactly)

```
features/<name>/
├── components/           # Feature-specific UI components
├── constants/            # Enums, route paths, config
├── hooks/                # Feature-specific React Query hooks
├── pages/                # Page-level components (one per route)
├── schemas/              # Zod schemas for forms
├── services/             # API calls for this feature (axios wrapper)
├── types/                # TypeScript interfaces for this feature
└── utils/                # Feature-specific pure utilities
```

---

## Key Conventions

- New features: create **both** a backend module AND a frontend module following the templates above.
- Shared logic stays in `src/shared/` — **never** duplicate across features.
- No business logic in controllers or pages — only in services.
- Routes are thin wiring: path → middleware → controller.
