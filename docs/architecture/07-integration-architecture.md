# Integration Architecture — KisanPatrika

> Version: 1.0 | Covers internal integration patterns and all external system touchpoints.

## 1. Integration Overview

```
                 ┌────────────────────────────────────────────────┐
                 │                KisanPatrika                    │
                 │                                                │
  Browser ──REST──▶ Next.js FE ──REST/JWT──▶ NestJS API           │
                 │                          │    │    │           │
                 │                    TypeORM│    │ioredis        │mongoose
                 │                          ▼    ▼    ▼           ▼
                 │                        MySQL  Redis  MongoDB  FS/S3
                 └──────┬───────────┬──────────┬───────────────────┘
                        │           │          │
                   Nominatim    SMTP/SES   Google OAuth
                   (geocode)    (email)    (identity)
```

## 2. Internal Integration Patterns

| Pattern | Where | Notes |
|---|---|---|
| **REST/JSON** | FE ↔ API | Single `lib/api.js` client; JWT bearer; `/api/v1` versioned |
| **Server-side render** | Admin panel | EJS inside API process; cookie session; no REST hop |
| **Shared DB** | Modules → MySQL | TypeORM; modules own their tables; cross-module reads via services, not table joins across boundaries where avoidable |
| **Cache/ephemeral** | Auth, captcha, OTP | Redis keys with TTL; single-use semantics for captcha |
| **Queue (target)** | Notifications, images, imports | BullMQ on Redis; producers in API, consumers in worker tier |
| **File system** | Uploads | multer → `uploads/` → static serve; target S3 presigned PUT |
| **Dual-write audit** | MySQL `audit_logs` + Mongo `activity_logs` | Mongo optional (`MONGO_ENABLED`); failures must not block request |

## 3. External Integrations

### 3.1 Nominatim (OpenStreetMap) — Geocoding

- **Use**: reverse-geocode browser GPS → state/district/tehsil/pincode autofill on register & sell forms.
- **Endpoint**: `GET https://nominatim.openstreetmap.org/reverse?lat=&lon=&format=json`
- **Called from**: `location` module (`GET /location/reverse`), server-side (avoids CORS, hides User-Agent policy needs).
- **Contract**: returns `address.{state, county/district, city/town, postcode}` → mapped to internal `stateId/districtId/cityId/pincode`.
- **Resilience**: timeout 5 s; on failure frontend falls back to manual dropdowns (fields are optional).
- **Rate**: respect Nominatim usage policy (≤1 req/s); cache results by rounded lat/lng in Redis (target).

### 3.2 SMTP — Email delivery

- **Use**: OTP emails, complaint/status notifications, admin alerts.
- **Mechanism**: `nodemailer` transport configured via env (`SMTP_HOST/PORT/USER/PASS`).
- **Current**: synchronous send inside request flow.
- **Target**: enqueue to BullMQ `mail` queue → worker sends via SES; retry with backoff; dead-letter after 5 attempts.
- **Templates**: server-side templates; keep language-neutral (EN) initially.

### 3.3 Google OAuth — Social sign-in

- **Use**: "Sign in with Google" on login page.
- **Mechanism**: `google-auth-library` verifies the ID token (`aud` = our client ID) → find-or-create user → issue our JWT.
- **Config**: `GOOGLE_CLIENT_ID` env; token verified server-side only.
- **Edge cases**: first-time Google users skip password; account linking by verified email.

### 3.4 Object Storage (target) — S3

- **Use**: product images, avatars, documents.
- **Pattern**: presigned PUT URL issued by API → browser uploads directly → API stores key → CDN serves.
- **Migration**: existing `uploads/` files synced once; URLs rewritten.

### 3.5 Future integrations (roadmap)

| System | Purpose | Pattern |
|---|---|---|
| SMS gateway (e.g. MSG91/Twilio) | OTP via SMS for low-email-penetration users | REST, queued |
| Payment gateway (Razorpay/UPI) | Membership fees, featured listings | REST + webhooks (signature-verified) |
| Weather API | `weather` page live data | REST, cached 30 min |
| Mandi/eNAM data | `mandi` page live mandi prices | Scheduled pull → MySQL |
| AI provider | `ai-assistant` page | REST; sessions in MongoDB |

## 4. Integration Security Requirements

- All external calls over **TLS**; certificates validated.
- Webhook endpoints (future payments) must verify **HMAC signatures** and be idempotent.
- Third-party credentials in **Secrets Manager**, never in code or `.env` committed to git.
- Outbound calls wrapped with **timeout + retry (max 3, exponential backoff)**; circuit-breaker for Nominatim.
- PII shared with third parties minimized (Google gets ID token only; SMTP gets email+name).

## 5. Failure & Fallback Matrix

| Dependency | Failure impact | Fallback |
|---|---|---|
| Nominatim | GPS autofill fails | Manual location dropdowns (fields optional) |
| SMTP | OTP email delayed | Resend OTP; (target) SMS channel |
| Google OAuth | Social login unavailable | Email/password path |
| Redis | OTP/captcha/blacklist down | Fail closed on auth; alert (Redis is critical) |
| MongoDB | Activity logs lost | `MONGO_ENABLED=false` tolerated; log to file |
| S3/CDN | Images broken | Placeholder image; origin fallback |

## 6. Data Format Standards

- **REST**: JSON, UTF-8, ISO-8601 timestamps, decimal prices as numbers (minor units avoided).
- **Uploads**: `multipart/form-data`; allowed mime `image/jpeg|png|webp`; ≤5 MB/file.
- **Excel import**: `.xlsx` via `xlsx` lib; row-level error report returned.
- **Geo**: WGS-84 lat/lng floats.
