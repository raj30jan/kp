# Architecture Decision Records (ADRs) — KisanPatrika

> Version: 1.0 | Format: Context → Decision → Consequences. Status: Accepted unless noted.

---

## ADR-001: Modular monolith over microservices

**Context**: Small team, early-stage product, uncertain scale. Microservices add operational cost (service discovery, distributed tracing, deployment complexity).

**Decision**: Single NestJS deployable with strict module boundaries (`auth`, `marketplace`, `location`, …). Modules communicate via injected services, never direct table access across boundaries.

**Consequences**: Simple deploy/debug; scaling is whole-app until a hotspot justifies extraction (workers first). Module discipline is enforced by code review.

---

## ADR-002: MySQL as single system of record

**Context**: Marketplace data is relational (users↔products↔categories↔locations); strong integrity needed.

**Decision**: MySQL 8.4, normalized 3NF, TypeORM. Redis and MongoDB are derived/ephemeral stores only — never the source of truth.

**Consequences**: Clear ownership and backup story; some reads need joins (mitigated by indexes and selective denormalization like product `location` string).

---

## ADR-003: Schema managed by SQL migrations, not TypeORM sync

**Context**: `synchronize:true` risks destructive/implicit DDL in production.

**Decision**: `synchronize:false` permanently. All DDL via `database/schema.sql` + numbered `migrations/NNN_*.sql` applied in order.

**Consequences**: Explicit, reviewable, reversible schema changes; requires migration discipline (documented in Deployment §6).

---

## ADR-004: JWT bearer tokens + Redis blacklist

**Context**: Stateless API needed for horizontal scaling; logout must actually revoke tokens.

**Decision**: JWT access tokens; on logout the token `jti` is blacklisted in Redis until natural expiry. `JwtStrategy` checks the blacklist per request.

**Consequences**: Scalable auth with real revocation; Redis becomes auth-critical (acceptable — it's already required for OTP/captcha). **Superseded partially by ADR-008** (refresh-cookie model) for the token-storage target.

---

## ADR-005: Separate EJS admin panel inside the API process

**Context**: Admin needs CRUD screens fast; building a separate SPA doubles frontend work.

**Decision**: Server-rendered EJS at `/admin/*` inside the NestJS app, cookie-session auth, excluded from `/api/v1` prefix. REST admin APIs (`/api/v1/admin/*`) exist separately for the Next.js side.

**Consequences**: Fast delivery, zero extra deployable; couples admin scaling to API (low traffic — acceptable); extraction candidate later (see ADR-007 note).

---

## ADR-006: Mandatory captcha + optional location at registration

**Context**: Bot registrations observed risk; GPS autofill makes manual location redundant for many users.

**Decision**: `captchaId`/`captchaAnswer` required on `POST /auth/register` (Redis-stored, single-use). `stateId/districtId/cityId/pincode` optional — filled manually or via Nominatim reverse-geocode.

**Consequences**: Lower signup friction, bot protection; captcha service dependency on Redis.

---

## ADR-007: Keep admin panel in-process now, extract later

**Context**: Admin traffic is low; extraction cost is real.

**Decision**: Defer extraction. Revisit when: admin traffic >5% of API, independent deploy cadence needed, or a dedicated admin SPA is justified.

**Consequences**: One deployable today; documented trigger conditions prevent premature/late extraction.

---

## ADR-008: Move JWT from localStorage to httpOnly refresh cookie (target)

**Context**: `localStorage` tokens are XSS-readable; current model has no refresh rotation.

**Decision (target)**: Short-lived access token (≤15 min) + refresh token in `httpOnly; Secure; SameSite=Lax` cookie with rotation and reuse detection.

**Consequences**: Better XSS posture; requires FE auth refactor and CSRF controls on cookie-authed routes. Status: **Proposed** (roadmap Phase 2).

---

## ADR-009: BullMQ worker tier for async work (target)

**Context**: Email sends, image thumbnails, and Excel imports block the request loop; 2-hour HTTP timeout is a smell.

**Decision**: BullMQ queues on Redis (`mail`, `image`, `import`, `expiry`); separate worker replicas consuming them; `@nestjs/schedule` jobs migrate to queued cron.

**Consequences**: Responsive API, retryable jobs, independent worker scaling; adds a deployable and queue-monitoring need. Status: **Proposed** (roadmap Phase 2).

---

## ADR-010: S3 + presigned uploads for media (target)

**Context**: Local `uploads/` is lost on redeploy and can't serve multiple API replicas.

**Decision**: API issues presigned PUT URLs; browser uploads to S3; CDN serves; sharp thumbnails generated async via `image` queue.

**Consequences**: Durable, scalable media; one-time migration of existing files + URL rewrite. Status: **Proposed** (roadmap Phase 2).

---

## ADR-011: Land parcels derived by query, not a flag column

**Context**: "Large land parcel" (>10 acres) is a presentation concern; a `is_large` column would duplicate derivable state.

**Decision**: Compute at query time — `category IN ('land','land-%') AND quantityUnit='acre' AND quantity>minAcres` (`findLargeLandParcels`).

**Consequences**: Single source of truth; threshold adjustable per request; relies on disciplined `quantityUnit='acre'` for land (enforced in sell form).

---

## ADR-012: Client-side auth guard with server re-authorization

**Context**: UX requires redirecting unauthenticated users before page render; security requires server checks regardless.

**Decision**: `AppShell` + `lib/auth-guard.js` whitelist redirects to `/login?next=`; every protected API endpoint independently validates JWT/role.

**Consequences**: Good UX without trusting the client; whitelist must be maintained when adding public pages.

---

## ADR-013: English/Hindi i18n at the frontend edge

**Context**: Primary users are Hindi-speaking farmers; catalog data is largely user-generated.

**Decision**: UI strings in per-page `text = {en, hi}` maps via `LangProvider`; API stays language-neutral; `translations` table reserved for future catalog i18n.

**Consequences**: Simple, no backend i18n complexity; new pages must supply both languages (quality gate).

---

## ADR-014: MongoDB optional for activity logs

**Context**: Audit/activity data is high-volume, schema-flexible, and non-critical vs transactional data.

**Decision**: MongoDB for `activity_logs`, gated by `MONGO_ENABLED`; MySQL `audit_logs` remains the guaranteed trail.

**Consequences**: Right tool for log-shaped data; system degrades gracefully when Mongo is down.

---

## ADR Register

| ADR | Decision | Status |
|---|---|---|
| 001 | Modular monolith | Accepted |
| 002 | MySQL system of record | Accepted |
| 003 | SQL migrations, no sync | Accepted |
| 004 | JWT + Redis blacklist | Accepted (evolving → 008) |
| 005 | In-process EJS admin | Accepted |
| 006 | Mandatory captcha, optional location | Accepted |
| 007 | Defer admin extraction | Accepted |
| 008 | httpOnly refresh cookie | Proposed |
| 009 | BullMQ worker tier | Proposed |
| 010 | S3 presigned uploads | Proposed |
| 011 | Derived land-parcel flag | Accepted |
| 012 | Client guard + server authz | Accepted |
| 013 | Edge i18n EN/HI | Accepted |
| 014 | Optional MongoDB logs | Accepted |
