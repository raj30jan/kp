# API Specification — KisanPatrika

> Version: 1.0 | Base URL: `{API_HOST}/api/v1` | Live docs: `/api/docs` (Swagger/OpenAPI 3)

## 1. General Conventions

- **Protocol**: HTTPS (target) / HTTP (dev). JSON request/response unless noted.
- **Auth**: `Authorization: Bearer <JWT>` for protected endpoints. Admin REST endpoints additionally require admin role.
- **Versioning**: URI-based (`/api/v1`). Breaking changes → `/api/v2`.
- **Validation**: unknown fields rejected (`forbidNonWhitelisted`); malformed payloads → 400 with field messages.
- **Pagination**: `?page=1&limit=20` → `{ items: [], total, page, limit }`.
- **Error envelope** (NestJS default):
  ```json
  { "statusCode": 400, "message": ["captchaAnswer should not be empty"], "error": "Bad Request" }
  ```

## 2. Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/auth/captcha` | — | Returns `{ captchaId, question }` (math question; answer stored in Redis) |
| POST | `/auth/register` | — | Register user. **Requires** `captchaId` + `captchaAnswer`; location ids optional when GPS-autofilled |
| POST | `/auth/verify-otp` | — | `{ userId, otp }` → verifies email, returns tokens |
| POST | `/auth/resend-otp` | — | New OTP to email |
| POST | `/auth/login` | — | `{ email, password }` → `{ accessToken, user }` |
| POST | `/auth/logout` | JWT | Blacklists current token (Redis) |
| POST | `/auth/google` | — | Google ID-token sign-in |
| GET | `/auth/me` | JWT | Current user profile |

### Register request

```json
{
  "name": "Rajinder Kumar",
  "email": "raj@example.com",
  "password": "Password@123",
  "phone": "9876543210",
  "countryId": "1",
  "stateId": "12",            // optional if GPS-filled
  "districtId": "56",         // optional
  "cityId": "89",             // optional (tehsil)
  "pincode": "110001",        // optional, 6 digits
  "captchaId": "a1b2c3d4",    // required
  "captchaAnswer": "12"       // required
}
```

## 3. Marketplace — `/marketplace`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/marketplace/products` | — | List active products. Query: `category, search, stateId, districtId, minPrice, maxPrice, page, limit, sort` |
| GET | `/marketplace/products/:id` | — | Product detail incl. images, seller, attributes |
| GET | `/marketplace/products/land/large-parcels?minAcres=10` | — | Highlighted land listings > minAcres → `{ items, total, minAcres }` |
| POST | `/marketplace/products` | JWT | Create product (status=`pending`) |
| PUT | `/marketplace/products/:id` | JWT (owner) | Update own product |
| DELETE | `/marketplace/products/:id` | JWT (owner/admin) | Remove product |
| POST | `/marketplace/products/:id/images` | JWT | Multipart upload (≤5 files) → sharp thumbnails |
| POST | `/marketplace/products/:id/react` | JWT | `{ reaction: 'like' \| 'dislike' }` toggle |
| GET | `/marketplace/my-products` | JWT | Seller's own listings (all statuses) |
| GET | `/marketplace/categories` | — | Category tree (hierarchical, incl. `land` + `land-*` subcats) |

### Product object (abridged)

```json
{
  "id": "p_123",
  "title": "Fresh Bananas",
  "category": "fruits",
  "price": 40,
  "priceUnit": "dozen",
  "quantity": 200,
  "quantityUnit": "dozen",
  "status": "active",
  "location": "Jalgaon, Maharashtra",
  "images": [{ "url": "/uploads/products/p_123/abc.jpg", "thumb": "/uploads/products/p_123/abc_t.jpg" }],
  "seller": { "id": "u_9", "name": "Ramesh Chaudhari" },
  "createdAt": "2026-01-30T10:00:00Z"
}
```

## 4. Location — `/location`

| Method | Path | Description |
|---|---|---|
| GET | `/location/countries` | All countries |
| GET | `/location/states?countryId=` | States |
| GET | `/location/districts?stateId=` | Districts |
| GET | `/location/cities?districtId=` | Tehsils/cities |
| GET | `/location/villages?cityId=` | Villages |
| GET | `/location/postal?code=` | Postal-code lookup |
| GET | `/location/reverse?lat=&lng=` | Reverse geocode (Nominatim) → internal ids |

## 5. Users & Profile — `/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | JWT | Full profile |
| PUT | `/users/me` | JWT | Update profile fields |
| PUT | `/users/me/password` | JWT | Change password (old + new) |
| PUT | `/users/me/avatar` | JWT | Upload avatar |

## 6. Membership — `/membership`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/membership/plans` | — | Available plans |
| POST | `/membership/subscribe` | JWT | `{ planId }` → subscription |
| GET | `/membership/my` | JWT | Current subscription & entitlements |

## 7. Complaints — `/complaints`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/complaints` | JWT | File complaint `{ subject, description, category }` |
| GET | `/complaints/my` | JWT | My tickets + status |
| GET | `/complaints/:id` | JWT (owner/admin) | Ticket detail + history |

## 8. Service Interest — `/service-interest`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/service-interest` | JWT | `{ serviceKey, message? }` — capture lead |
| GET | `/service-interest/my` | JWT | My expressed interests |

## 9. Admin REST — `/api/v1/admin/*` (JWT + admin role)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/users` | List/search users |
| PUT | `/admin/users/:id/status` | Activate/suspend |
| GET | `/admin/products?status=pending` | Moderation queue |
| PUT | `/admin/products/:id/status` | Approve/reject |
| GET | `/admin/complaints` | All tickets |
| PUT | `/admin/complaints/:id` | Update status/response |
| GET | `/admin/leads` | Service-interest leads |
| GET/PUT | `/admin/settings` | Platform settings |

> The server-rendered admin panel lives at `/admin/*` (outside `/api/v1`) with cookie-session auth — see Security doc.

## 10. Status & Error Codes

| Code | When |
|---|---|
| 200/201 | Success / created |
| 400 | Validation failure, bad captcha |
| 401 | Missing/expired/blacklisted token, bad credentials |
| 403 | Insufficient role, unverified account |
| 404 | Entity not found |
| 409 | Duplicate (email, unique key) |
| 413 | Upload/body too large |
| 429 | Rate limited (target) |
| 500 | Unhandled server error |

## 11. Frontend API Client Mapping (`lib/api.js`)

Each method maps 1:1 to an endpoint, e.g. `api.getLargeLandParcels(10)` → `GET /marketplace/products/land/large-parcels?minAcres=10`. New endpoints must be added there and documented in Swagger via `@ApiOperation`/`@ApiProperty`.
