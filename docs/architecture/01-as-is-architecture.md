# As-Is Architecture — KisanPatrika

> Version: 1.0 | Status: Current state (development environment)

## 1. Overview

KisanPatrika is a farmer-facing marketplace and services platform. The current implementation is a **two-tier web application** running on a single developer machine:

- **Public web app** — Next.js 14 (App Router), React 18, TailwindCSS. Port `3000`.
- **REST API + Admin UI** — NestJS 10 monolith on Express. Port `4000`.
- **Data stores** — MySQL 8.4 (primary), MongoDB 8.0 (activity logs), Redis 8.0 (OTP/captcha/JWT blacklist).

## 2. Current System Context

```
                        ┌─────────────────────────────────────────────┐
                        │              Developer Machine              │
                        │                                             │
   Farmer / Buyer       │   ┌──────────────┐      ┌───────────────┐   │
   (browser) ───────────┼──▶│  Next.js FE  │─────▶│  NestJS API   │   │
                        │   │   :3000      │ REST │   :4000       │   │
   Platform Admin       │   └──────────────┘      │  /api/v1/*    │   │
   (browser) ───────────┼────────────────────────▶│  /admin/* EJS │   │
                        │                         └──────┬────────┘   │
                        │              ┌─────────────────┼─────────┐  │
                        │              ▼                 ▼         ▼  │
                        │        ┌──────────┐    ┌──────────┐ ┌─────┐ │
                        │        │  MySQL   │    │ MongoDB  │ │Redis│ │
                        │        │  8.4     │    │  8.0     │ │ 8.0 │ │
                        │        └──────────┘    └──────────┘ └─────┘ │
                        └─────────────────────────────────────────────┘

   External: Nominatim (geocoding), SMTP (nodemailer), Google OAuth (google-auth-library)
```

## 3. Application Components (As Built)

### 3.1 Frontend (`frontend/`)

| Area | Implementation |
|---|---|
| Framework | Next.js 14 App Router, React 18, JSX (no TS on pages) |
| Styling | TailwindCSS 3.4, `lucide-react` icons, `recharts` for dashboard charts |
| Pages | `page.jsx` (home), `login`, `register`, `verify-otp`, `marketplace`, `marketplace/[id]`, `sell`, `my-products`, `dashboard`, `profile`, `membership`, `complaints`, `schemes`, `mandi`, `weather`, `my-farm`, `ai-assistant`, `service`, `categories`, `about`, `contact`, `help`, `privacy` |
| Auth handling | `lib/auth-guard.js` public-path list; `AppShell.jsx` redirects unauthenticated users to `/login?next=…`; JWT stored in `localStorage` (`kp_token`) |
| API client | `lib/api.js` — fetch wrapper against `NEXT_PUBLIC_API_URL` (`/api/v1`) |
| i18n | `lib/lang-context.js` — English/Hindi toggle, client-side string maps |
| Notable UI | `FeaturedProductsMarquee` (auto-scroll of newly added products), Large Land Parcels banner, captcha on register, GPS autofill via Nominatim |

### 3.2 Backend (`backend/src/`)

| Module | Responsibility |
|---|---|
| `auth` | Register (captcha-gated), login, JWT issue/verify, OTP, logout + Redis token blacklist, Google OAuth |
| `users` | User profile management |
| `marketplace` | Product CRUD, images (multer + sharp), reactions, history, admin approval, large-land-parcel query |
| `categories` | Hierarchical category tree, attributes |
| `location` | Countries → states → districts → cities (tehsil) → villages, postal codes, Nominatim reverse geocode |
| `membership` | Membership plans & subscriptions |
| `complaints` | Complaint ticketing |
| `service-interest` | "I'm interested" leads on services |
| `notifications` | Notification delivery (email via nodemailer) |
| `admin-users` | REST API for admin user management (`/api/v1/admin/users`) |
| `admin-ui` | Server-rendered EJS admin panel at `/admin/*` (session-cookie auth, separate from JWT) |
| `mongo` | Optional MongoDB connection (`MONGO_ENABLED`) for activity logs |
| `redis` | ioredis client — OTP store, captcha answers, JWT blacklist |
| `common` | Shared guards/decorators/utils |
| `config` | Joi env validation (`env.validation.ts`) |

### 3.3 Cross-cutting behavior

- **Global prefix** `/api/v1`; `/admin/*` excluded (EJS panel).
- **ValidationPipe** global: `whitelist`, `forbidNonWhitelisted`, `transform`.
- **CORS**: `origin: true, credentials: true` (permissive — dev posture).
- **Body limits**: 15 MB JSON/urlencoded; real uploads via multipart (multer).
- **Static assets**: `uploads/` served at `/uploads/*` from backend cwd.
- **Swagger**: `/api/docs`.
- **HTTP timeouts**: 2 h (for long Excel imports).
- **TypeORM `synchronize: false`** — schema managed via `database/schema.sql` + `migrations/`.

## 4. Data Stores (As-Is)

| Store | Role | Notes |
|---|---|---|
| MySQL `kisanpatrika` | System of record | ~100 tables, 3NF: users, roles/permissions, products, categories, locations, addresses, images, memberships, complaints, audit_logs, status_master |
| MongoDB | Activity logs, future chat/AI sessions | Optional via `MONGO_ENABLED` |
| Redis | Ephemeral state | OTP TTL, captcha answers, JWT blacklist; BullMQ installed for future queues |
| Filesystem | `backend/uploads/` | Product images served statically |

## 5. Authentication & Authorization (As-Is)

- **Public users**: email+password (bcrypt) → JWT bearer token in `localStorage`; OTP verification flow; mandatory captcha at registration; optional Google sign-in.
- **Admin panel**: separate cookie-session login at `/admin/login`, guarded by `AdminSessionGuard` / `SuperAdminSessionGuard`.
- **RBAC**: `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permissions` tables; `super_admin`, `admin` roles seeded.
- **Frontend guard**: route-level `AuthGuard` — everything except whitelisted public paths requires `kp_token`.

## 6. Integrations (As-Is)

| External system | Use | Mechanism |
|---|---|---|
| Nominatim (OSM) | Reverse geocode GPS → address autofill | HTTP from `location` module |
| SMTP server | OTP & notification emails | nodemailer |
| Google Identity | Social login | google-auth-library token verify |

## 7. Known Gaps / Limitations (Current State)

- **Single-host deployment** — no containerization, no process manager config, no reverse proxy.
- **Permissive CORS** (`origin: true`) — acceptable for dev only.
- **JWT in localStorage** — XSS-exposed; no refresh-token rotation.
- **No HTTPS** anywhere; no rate limiting / WAF.
- **No automated tests** wired into CI; `jest` script exists but suite is minimal.
- **Uploads on local disk** — not shared/durable; no CDN.
- **No backups, monitoring, log aggregation, or DR** defined.
- **MongoDB optional & underused** — activity logging only.
- **Admin panel is EJS inside the API process** — coupled scaling/deploy.
- **Secrets in `.env`** on the host — no vault/secret manager.

## 8. As-Is Quality Attributes

| Attribute | Current posture |
|---|---|
| Availability | Single instance; dev-grade |
| Scalability | Vertical only; stateless API possible but untested |
| Security | Baseline (bcrypt, JWT, validation, captcha); gaps above |
| Observability | Console logs only |
| Maintainability | Modular NestJS; clean module boundaries |
| i18n | EN/HI on frontend only |
