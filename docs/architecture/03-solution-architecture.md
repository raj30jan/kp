# Solution Architecture — KisanPatrika

> Version: 1.0 | Bridges business capabilities → technical design

## 1. Purpose

This document maps KisanPatrika's business capabilities to the solution's building blocks, defines how they interact, and records the architectural principles that govern implementation. It is the umbrella document for the HLD, LLD, and the specialized architecture views (API, Data, Security, Deployment, DR).

## 2. Business Capability Map

| Capability | Description | Owning module(s) |
|---|---|---|
| Identity & Access | Registration (captcha + OTP), login, social login, sessions, RBAC | `auth`, `users`, `admin-users` |
| Marketplace | Product listing, categories, images, search/filter, reactions, land parcels | `marketplace`, `categories` |
| Location Services | Country→state→district→tehsil→village hierarchy, GPS autofill | `location` |
| Membership | Plans, subscriptions, entitlements | `membership` |
| Complaints & Support | Ticketing, status workflow | `complaints` |
| Service Leads | Interest capture on schemes/services | `service-interest` |
| Notifications | Email/OTP delivery | `notifications` |
| Administration | User/product/complaint/category/lead management, settings | `admin-ui`, `admin-users` |
| Audit & Activity | Activity logs, audit trail | `mongo`, `audit_logs` |
| Content & Info | Schemes, mandi rates, weather, AI assistant (frontend surfaces) | frontend pages |

## 3. Solution Building Blocks

```
┌────────────────────────────────────────────────────────────────────┐
│                        CHANNELS                                    │
│   Public Web (Next.js)      Admin Panel (EJS under /admin)         │
└───────────────┬──────────────────────────┬─────────────────────────┘
                │ REST /api/v1 (JWT)       │ server-rendered (cookie session)
┌───────────────▼──────────────────────────▼─────────────────────────┐
│                     NESTJS APPLICATION (modular monolith)          │
│  ┌─────────┐ ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌────────┐  │
│  │  auth   │ │ marketplace│ │ location │ │ membership│ │complnt │  │
│  └─────────┘ └────────────┘ └──────────┘ └───────────┘ └────────┘  │
│  ┌─────────┐ ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌────────┐  │
│  │  users  │ │ categories │ │ notif.   │ │ svc-int.  │ │admin-ui│  │
│  └─────────┘ └────────────┘ └──────────┘ └───────────┘ └────────┘  │
│  Cross-cutting: ValidationPipe · JWT guard · RBAC · Swagger · CORS │
└───┬──────────────┬──────────────────┬──────────────────┬───────────┘
    │ TypeORM      │ ioredis          │ mongoose         │ fs/multer
┌───▼───────┐ ┌────▼─────┐ ┌──────────▼───────┐ ┌────────▼─────────┐
│  MySQL    │ │  Redis   │ │  MongoDB         │ │ uploads/ (→ S3)  │
│  (3NF)    │ │ OTP/BL/  │ │  activity logs   │ │ product images   │
│           │ │ captcha  │ │                  │ │                  │
└───────────┘ └──────────┘ └──────────────────┘ └──────────────────┘
```

## 4. Interaction Patterns

- **Request/response REST** — all frontend↔backend traffic; versioned under `/api/v1`.
- **Server-side rendering** — admin panel (EJS) rendered inside the API process; auth via session cookie, not JWT.
- **DTO validation at the edge** — `class-validator` DTOs + global `ValidationPipe` (whitelist + forbidNonWhitelisted).
- **Repository pattern** — TypeORM repositories per entity; services hold business logic; controllers stay thin.
- **Ephemeral state in Redis** — OTPs, captcha answers, JWT blacklist with TTLs.
- **Async (target)** — BullMQ queues for email, image processing, imports; cron via `@nestjs/schedule` today.
- **Static media** — multer → `uploads/` → served at `/uploads/*` (target: S3 + CDN, presigned PUT).

## 5. Architectural Principles

1. **Modular monolith first** — one deployable, strict module boundaries; extract services only when scaling demands it.
2. **Single source of truth** — MySQL is the system of record; Redis/Mongo are derived/ephemeral stores.
3. **Schema by migration** — `synchronize: false`; all DDL via `schema.sql` + numbered migrations.
4. **Thin controllers, fat services** — controllers map HTTP↔DTO; services own rules; entities own persistence shape.
5. **Validate at the boundary** — DTOs reject unknown/malformed fields before logic runs.
6. **Stateless API** — no in-process session for public API; JWT + Redis blacklist enables horizontal scaling.
7. **i18n at the edge** — EN/HI strings live in the frontend; API stays language-neutral (translations table reserved for catalog data).
8. **Fail closed** — auth guard denies by default; public paths are an explicit whitelist (`auth-guard.js`).

## 6. Key Flows (Solution Level)

### 6.1 Registration
`Register page → GET /auth/captcha (Redis store) → POST /auth/register (validate captcha → bcrypt hash → insert user → OTP → Redis) → verify-otp → JWT issued`

### 6.2 Product listing with images
`Sell page → POST /marketplace/products (DTO) → multipart images → multer → sharp thumbnail → uploads/ → product row (status=pending) → admin approval → status=active → visible in marketplace`

### 6.3 Large land parcels
`Land category selected → quantityUnit forced 'acre' → product saved → GET /marketplace/products/land/large-parcels?minAcres=10 → banner + badge on FE`

### 6.4 Admin moderation
`Admin → /admin/login (cookie session) → EJS pages → service layer → MySQL; REST admin APIs under /api/v1/admin/* for the Next.js side`

## 7. Traceability to Other Documents

| Concern | Document |
|---|---|
| Current vs target state | `01-as-is`, `02-to-be` |
| Component & module detail | `04-high-level-design`, `05-low-level-design` |
| Endpoint contracts | `06-api-specification` |
| External systems | `07-integration-architecture` |
| Schema & data flows | `08-data-architecture` |
| AuthN/Z, threats, controls | `09-security-architecture` |
| Environments & infra | `10-deployment-architecture` |
| Backup/restore/DR | `11-dr-architecture` |
| Versions & standards | `12-technical-specification` |
| Decisions | `13-architecture-decision-records` |
| Phasing | `14-implementation-roadmap` |
