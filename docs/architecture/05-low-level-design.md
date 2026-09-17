# Low-Level Design (LLD) — KisanPatrika

> Version: 1.0 | Audience: implementers. Details classes, DTOs, flows, and DB interactions per module.

## 1. Conventions

- **Controller → Service → Repository**. Controllers never touch repositories.
- Every mutating endpoint has a **DTO** with `class-validator` decorators + `@ApiProperty` for Swagger.
- Entities map 1:1 to MySQL tables; `synchronize: false` — schema changes go through `database/migrations/NNN_*.sql`.
- Errors: `BadRequestException` (400), `UnauthorizedException` (401), `ForbiddenException` (403), `NotFoundException` (404), `ConflictException` (409).

## 2. Auth Module (`backend/src/auth/`)

### 2.1 Classes

| Class | Role |
|---|---|
| `AuthController` | `/auth/*` routes: register, login, logout, captcha, OTP, google |
| `AuthService` | Orchestrates registration, login, OTP, captcha, blacklist |
| `JwtStrategy` | passport-jwt; validates `Authorization: Bearer`, checks Redis blacklist |
| `RegisterDto` | email, password, name, phone, optional location ids, **mandatory** `captchaId`, `captchaAnswer` |
| `LoginDto` | email, password |
| `JwtAuthGuard` | Route guard for protected endpoints |

### 2.2 Registration sequence

```
POST /api/v1/auth/register
 1. validateCaptcha(dto.captchaId, dto.captchaAnswer)   // Redis lookup, throws if missing/wrong
 2. Check email uniqueness → ConflictException
 3. bcrypt.hash(password, 10)
 4. INSERT users (+ user_profiles, entity_addresses if location ids present)
 5. Generate 6-digit OTP → Redis SET otp:<userId> TTL 10min → nodemailer
 6. Return { userId, otpSent: true }
```

`validateCaptcha(captchaId?, answer?)` — throws `BadRequestException('Captcha is required')` when either is absent; compares against `captcha:<id>` in Redis; deletes key on use (single-use).

### 2.3 Login sequence

```
POST /api/v1/auth/login
 1. Find user by email → 401 if absent
 2. bcrypt.compare → 401 on mismatch
 3. Check status (active, verified) → 403 otherwise
 4. Sign JWT { sub, email, role } exp=JWT_EXPIRES_IN
 5. INSERT user_sessions (device, ip)
 6. Return { accessToken, user }
```

### 2.4 Logout / blacklist

`POST /auth/logout` → extract jti+exp → `SET jwtbl:<jti> 1 EX <remaining-ttl>`. `JwtStrategy.validate()` rejects blacklisted jtis.

## 3. Marketplace Module (`backend/src/marketplace/`)

### 3.1 Classes

| Class | Role |
|---|---|
| `ProductController` | `/marketplace/*` — products CRUD, images, reactions, land parcels |
| `ProductService` | Listing logic, filters, approval workflow, `findLargeLandParcels` |
| `CreateProductDto` / `ListProductsDto` | Validation; `PRODUCT_CATEGORIES` enum incl. `land` |
| `Product` entity | products table (status: pending/active/rejected/expired) |

### 3.2 Product list query

`findAll(dto)` builds QueryBuilder: filters `category`, `status='active'`, `search` (LIKE title/description), `districtId`, `stateId`, price range; pagination `page`/`limit`; order `createdAt DESC`.

### 3.3 Large land parcels

```ts
findLargeLandParcels(minAcres = 10)
  .where('p.status = :status', { status: 'active' })
  .andWhere('(p.category = :land OR p.category LIKE :landPrefix)',
            { land: 'land', landPrefix: 'land-%' })
  .andWhere('p.quantityUnit = :unit', { unit: 'acre' })
  .andWhere('p.quantity > :minAcres', { minAcres })
  .orderBy('p.quantity', 'DESC')
```

Endpoint: `GET /api/v1/marketplace/products/land/large-parcels?minAcres=10` → `{ items, total, minAcres }`.

### 3.4 Image upload flow

```
POST /marketplace/products/:id/images (multipart, ≤5 files, ≤5MB each)
 → multer diskStorage → uploads/products/<id>/<uuid>.<ext>
 → sharp: resize 1200px + thumb 300px
 → INSERT images + entity_images(product)
 → return URLs
```

### 3.5 Approval workflow

`pending → active | rejected` via admin (`/admin/products` EJS or REST). Cron (`@nestjs/schedule`) marks `active → expired` past `expiresAt`.

## 4. Location Module

- `GET /location/countries`, `/states?countryId=`, `/districts?stateId=`, `/cities?districtId=` (tehsils), `/villages?cityId=`, `/postal?code=`.
- `GET /location/reverse?lat=&lng=` → proxies Nominatim → maps to internal ids → returns `{ stateId, districtId, cityId, pincode, formatted }` for GPS autofill on register/sell.

## 5. Frontend Key Components

| Component | File | Contract |
|---|---|---|
| `AppShell` | `app/components/AppShell.jsx` | Wraps all pages; `isPublicPath(pathname)` → render or redirect `/login?next=` |
| `FeaturedProductsMarquee` | `app/components/FeaturedProductsMarquee.jsx` | Props `{ lang, onProductClick }`; duplicates list for seamless `-50%` keyframe loop; sorts `isNew` first |
| `api` | `lib/api.js` | `request(path, opts)` adds Bearer token; methods per endpoint incl. `getLargeLandParcels(minAcres)` |
| Sell form | `app/sell/page.jsx` | `isLandCategory` → forces `quantityUnit='acre'`, label "Area (in acres)", hint about >10-acre highlight |
| Marketplace page | `app/marketplace/page.jsx` | Fetches products + `getLargeLandParcels(10)`; renders amber banner + `Large Parcel` badge via `isLargeParcel(p)` |

## 6. Database Interactions (hot paths)

| Flow | Tables touched | Notes |
|---|---|---|
| Register | users, user_profiles, user_verification, entity_addresses, addresses | Transactional insert |
| Login | users, user_sessions | bcrypt compare; session row |
| Product list | products, categories, images (join) | Indexed on status, category, created_at |
| Product create | products, product_attribute_values, images, entity_images | Multi-write in transaction |
| Land parcels | products | Filter on category prefix + quantity/unit |
| Complaints | complaints, complaint_history, status_master | Status workflow |
| Leads | service_interests | Notify admin |
| Audit | audit_logs (MySQL) + activity_logs (Mongo) | Dual-write where enabled |

## 7. Redis Key Schema

| Key pattern | Value | TTL |
|---|---|---|
| `otp:<userId>` | 6-digit code | 10 min |
| `captcha:<captchaId>` | expected answer | 10 min, single-use |
| `jwtbl:<jti>` | `1` | remaining token lifetime |
| `bull:<queue>:*` (target) | BullMQ job data | per job |

## 8. Error Handling Matrix

| Scenario | Exception | FE behavior |
|---|---|---|
| Missing/invalid captcha | 400 | Inline error + auto-refresh captcha |
| Duplicate email | 409 | "Email already registered" |
| Bad credentials | 401 | "Invalid email or password" |
| Expired/blacklisted JWT | 401 | Clear `kp_token`, redirect login |
| Validation failure | 400 + field errors | Field-level messages via `fieldRefs` scroll |
| Upload too large | 413 | "File too large" toast |

## 9. Testing Hooks (LLD-level)

- Unit: `AuthService.validateCaptcha`, `ProductService.findLargeLandParcels` (mock repos).
- Integration: supertest against `/api/v1` with test DB.
- FE: component tests for `isLandCategory` logic and marquee ordering.
