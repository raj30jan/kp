# High-Level Design (HLD) — KisanPatrika

> Version: 1.0 | Audience: architects, senior engineers, reviewers

## 1. Scope

Component-level design of the three deployables: **Next.js frontend**, **NestJS backend** (REST + EJS admin), and the **data tier** (MySQL, Redis, MongoDB, file storage).

## 2. Layered Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ PRESENTATION                                                 │
│  Next.js pages/components (public)   EJS views (admin)       │
├──────────────────────────────────────────────────────────────┤
│ API / CONTROLLER                                             │
│  REST controllers /api/v1/*          AdminUi controllers /admin/* │
│  DTOs · ValidationPipe · Swagger                             │
├──────────────────────────────────────────────────────────────┤
│ SERVICE (business logic)                                     │
│  AuthService ProductService LocationService …                │
│  Guards: JwtAuthGuard · RolesGuard · AdminSessionGuard       │
├──────────────────────────────────────────────────────────────┤
│ PERSISTENCE                                                  │
│  TypeORM repositories (MySQL) · Mongoose (Mongo) · ioredis   │
├──────────────────────────────────────────────────────────────┤
│ INFRASTRUCTURE                                               │
│  multer/sharp (images) · nodemailer · Nominatim · cron       │
└──────────────────────────────────────────────────────────────┘
```

## 3. Frontend Design (Next.js 14, App Router)

### 3.1 Structure

```
frontend/
  app/                 # routes (App Router)
    layout.jsx         # root layout → AppShell
    page.jsx           # home (services, schemes, marquee, Fasal Bima)
    login/ register/ verify-otp/
    marketplace/       # listing grid + land-parcel banner
      [id]/            # product detail
    sell/ my-products/ dashboard/ profile/ membership/
    complaints/ schemes/ mandi/ weather/ my-farm/ ai-assistant/
    service/ categories/ about/ contact/ help/ privacy/
    components/        # Navbar, Footer, AppShell, FeaturedProductsMarquee, …
  lib/
    api.js             # fetch wrapper → NEXT_PUBLIC_API_URL
    auth-guard.js      # PUBLIC_PATHS whitelist + isPublicPath()
    lang-context.js    # EN/HI provider
```

### 3.2 Key design decisions

- **Client-side auth guard**: `AppShell` checks `kp_token` in `localStorage`; non-public paths redirect to `/login?next=<path>`. Public paths are whitelisted in `lib/auth-guard.js`.
- **Server vs client components**: pages are `'use client'` where they call the API; static pages (about/privacy) can stay server-rendered.
- **i18n**: `LangProvider` context; each page holds an `text = { en: …, hi: … }` map.
- **API access**: single `api.js` wrapper — attaches `Authorization: Bearer <kp_token>`, parses errors, exposes one method per endpoint.
- **Media**: product images referenced by absolute URL to backend `/uploads/*` (target: CDN URL).

## 4. Backend Design (NestJS 10)

### 4.1 Module map

| Module | Controllers | Services | Entities (MySQL) | External deps |
|---|---|---|---|---|
| `auth` | AuthController | AuthService, JwtStrategy | users, user_verification, user_sessions | Redis (OTP/captcha/blacklist), bcrypt, Google |
| `users` | UsersController | UsersService | users, user_profiles, addresses | — |
| `marketplace` | ProductController | ProductService | products, product_images, categories, reactions, history | multer, sharp |
| `categories` | CategoriesController | CategoriesService | categories, category_attributes | — |
| `location` | LocationController | LocationService | countries, states, districts, cities, villages, postal_codes | Nominatim HTTP |
| `membership` | MembershipController | MembershipService | membership_plans, subscriptions | — |
| `complaints` | ComplaintsController | ComplaintsService | complaints, complaint_history | notifications |
| `service-interest` | ServiceInterestController | ServiceInterestService | service_interests (leads) | notifications |
| `notifications` | — | NotificationService | notification_templates | nodemailer, (BullMQ target) |
| `admin-users` | AdminUsersController | AdminUsersService | users, roles, permissions | JWT + RolesGuard |
| `admin-ui` | AdminUiController + 6 sub-controllers | AdminUiService | (reuses services) | EJS, cookie session |
| `mongo` | — | MongoService | activity_logs (MongoDB) | mongoose |
| `redis` | — | RedisService | — | ioredis |

### 4.2 Request pipeline

```
HTTP → CORS → cookieParser → json/urlencoded (15mb)
     → global prefix /api/v1 (except /admin/*)
     → Guards (JWT / Roles / AdminSession)
     → ValidationPipe (whitelist, forbidNonWhitelisted, transform)
     → Controller → Service → Repository → MySQL/Redis/Mongo
     → Interceptors/exception filters → JSON response
```

### 4.3 AuthN/Z design

- **Public API**: `POST /auth/login` → JWT (payload: sub, email, role) → `Authorization: Bearer` on subsequent calls. Logout pushes token jti to Redis blacklist until exp.
- **Admin panel**: `/admin/login` → server session → `connect.sid`-style cookie → `AdminSessionGuard`; `SuperAdminSessionGuard` for super-admin-only pages.
- **RBAC**: `roles`/`permissions`/`role_permissions`/`user_roles`/`user_permissions`; `RolesGuard` checks required permission per route.

### 4.4 File upload design

`multipart/form-data → multer (disk storage, size/type limits) → sharp (resize + thumbnail) → uploads/<product>/<file> → row in images/entity_images → URL /uploads/…`

### 4.5 Background processing

- **Now**: `@nestjs/schedule` cron (product expiry), synchronous nodemailer.
- **Target**: BullMQ queues on Redis — `mail`, `image`, `import`, `expiry` — consumed by worker replicas.

## 5. Data Tier Design

| Store | Contents | Access pattern |
|---|---|---|
| MySQL | ~100 normalized tables (see Data Architecture) | TypeORM repos; transactions in services |
| Redis | `otp:<userId>`, `captcha:<id>`, `jwtbl:<jti>`, (target) BullMQ queues | TTL-based keys |
| MongoDB | `activity_logs` collection (user actions, admin actions) | Mongoose; write-through from services |
| Disk/S3 | Original + thumbnail images | Static serve / CDN |

## 6. Deployment Units (HLD)

| Unit | Tech | Scaling | Notes |
|---|---|---|---|
| `kisanpatrika-frontend` | Next.js | N replicas / Vercel | Stateless |
| `kisanpatrika-api` | NestJS | N replicas behind LB | Stateless; holds admin UI |
| `kisanpatrika-worker` (target) | NestJS BullMQ | N replicas | Shares codebase, different entrypoint |
| MySQL / Redis / Mongo / S3 | Managed | Vertical + replicas | See Deployment doc |

## 7. Cross-Cutting Concerns

- **Validation**: DTOs everywhere; global pipe.
- **Error model**: NestJS exceptions → `{ statusCode, message, error }`; FE surfaces `message`.
- **Logging**: console now → structured JSON + correlation IDs (target).
- **Config**: `.env` validated by Joi at boot; fail-fast on missing vars.
- **Versioning**: URI versioning `/api/v1`; breaking changes → `/api/v2`.
- **Timeouts**: HTTP server 2 h for Excel imports (target: move imports to queue + polling).

## 8. HLD Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Monolith coupling admin panel to API scaling | Keep EJS panel low-traffic; extract later (ADR-007) |
| localStorage JWT theft via XSS | Move to httpOnly refresh cookie + short-lived access token (Security doc) |
| Long-running imports block event loop | BullMQ worker + status polling |
| Local uploads lost on redeploy | S3 + presigned uploads |
