# Data Architecture — KisanPatrika

> Version: 1.0 | System of record: MySQL 8.4 (`kisanpatrika`), ~100 tables, 3NF. Schema managed via `backend/database/schema.sql` + `migrations/`.

## 1. Data Store Roles

| Store | Role | Data class |
|---|---|---|
| **MySQL** | System of record — all transactional/master data | Persistent, relational |
| **Redis** | Ephemeral state — OTP, captcha, JWT blacklist, (target) queues | Volatile, TTL |
| **MongoDB** | Activity logs, future chat/AI sessions | Append-only, semi-structured |
| **Filesystem → S3** | Product images, avatars, documents | Binary objects |

## 2. MySQL Schema — Domain Grouping

### 2.1 Identity & Access

| Table | Purpose |
|---|---|
| `users` | Core account (email, password_hash, status) |
| `user_profiles` | Name, avatar, bio, demographics |
| `user_devices` / `user_sessions` | Device registry, login sessions |
| `user_preferences` / `user_languages` | Settings, preferred language |
| `user_social_accounts` | Google OAuth linkage |
| `user_verification` | Email/phone verification state |
| `user_kyc` | KYC documents/status (future) |
| `roles`, `role_hierarchy` | Role definitions & nesting |
| `permissions`, `permission_groups`, `permission_group_permissions` | Permission catalog |
| `role_permissions`, `user_roles`, `user_permissions` | RBAC assignments |

### 2.2 Geography

`countries → states → districts → cities (tehsil) → villages`, plus `postal_codes`, `geo_locations` (lat/lng), `addresses`, `entity_addresses` (polymorphic address link for users/products).

### 2.3 Catalog & Marketplace

| Table | Purpose |
|---|---|
| `categories` | Hierarchical tree (parent_id); includes `land` + `land-*` subcategories |
| `category_attributes`, `category_attribute_values` | Per-category dynamic attributes |
| `units`, `tags` | Measurement units, tagging |
| `products` | Listing core: title, category, price, quantity, quantityUnit (`acre` for land), status, expiresAt |
| `product_variants`, `product_prices`, `product_inventory` | Variants/pricing/stock |
| `product_attribute_values` | Product→attribute values |
| `product_videos` | Video links |
| `product_reviews`, `product_views`, `product_favourites` | Engagement |
| `images`, `entity_images` | Image store + polymorphic link |
| `documents`, `entity_documents` | Document store + link |

### 2.4 Business Operations

| Table | Purpose |
|---|---|
| `membership_plans`, `subscriptions` | Plans & user subscriptions |
| `complaints`, `complaint_history` | Tickets + status trail |
| `service_interests` | Leads on services/schemes |
| `notification_templates`, `notifications` | Templates + sent log |
| `status_master` | Central status codes |
| `audit_logs` | Admin/system audit trail |
| `translations` | Catalog i18n (reserved) |

## 3. Key Relationships (ER summary)

```
users 1───* user_profiles        users *───* roles (via user_roles)
users 1───* products             products *───1 categories (self-FK parent_id)
products 1───* entity_images ───* images
products 1───* product_attribute_values ───* category_attributes
users 1───* entity_addresses ───* addresses ───* geo_locations
countries 1───* states 1───* districts 1───* cities 1───* villages
users 1───* complaints 1───* complaint_history ───* status_master
users 1───* subscriptions ───* membership_plans
```

## 4. Data Flows

### 4.1 Registration data flow
`RegisterDto → users + user_profiles (+ addresses/entity_addresses when location chosen) → user_verification (OTP pending) → verified`

### 4.2 Product lifecycle
`Create → products(status=pending) + images → admin approve → active → (cron) expired | admin reject → rejected`

### 4.3 Land parcel classification
`category='land'|'land-%' AND quantityUnit='acre' AND quantity>10` — derived at query time, no separate flag column (keeps single source of truth).

### 4.4 Audit dual-write
`Mutating admin/user actions → audit_logs (MySQL, guaranteed) + activity_logs (MongoDB, best-effort)`

## 5. Redis Data Model

| Key | Type | TTL | Written by |
|---|---|---|---|
| `otp:<userId>` | string | 600 s | AuthService |
| `captcha:<id>` | string | 600 s | AuthService (single-use DEL on verify) |
| `jwtbl:<jti>` | string | token exp | AuthService.logout |
| `geo:<lat,lng>` (target) | hash | 24 h | LocationService |
| `bull:<queue>:*` (target) | BullMQ | job | producers |

## 6. MongoDB Collections

| Collection | Shape | Retention |
|---|---|---|
| `activity_logs` | `{ userId, action, entity, entityId, meta, ip, ts }` | 90 days hot → archive |
| `ai_sessions` (future) | `{ userId, messages[], createdAt }` | 1 year |

## 7. Data Quality & Integrity

- **Constraints**: PKs, FKs, unique indexes (email), check-like enums via lookup tables (`status_master`).
- **Validation**: DTO-level (format) + DB-level (integrity). Never rely on FE alone.
- **Normalization**: 3NF; deliberate denormalization only for read-hot fields (e.g. product `location` string cache).
- **Soft patterns**: status columns over hard deletes for products/users (auditability).

## 8. Indexing Strategy (hot paths)

| Table | Index | Supports |
|---|---|---|
| `products` | `(status, category, created_at)` | Marketplace grid |
| `products` | `(category, quantity_unit, quantity)` | Large-parcel query |
| `users` | `UNIQUE(email)` | Login/register |
| `cities/districts/states` | `(parent_fk)` | Location dropdowns |
| `audit_logs` | `(entity, entity_id, ts)` | Audit lookups |
| `service_interests` | `(user_id, created_at)` | My leads |

## 9. Migration & Governance

- `synchronize: false` — **all** DDL via numbered SQL migrations in `database/migrations/`.
- Naming: `NNN_description.sql`, applied in order, recorded in a `schema_migrations` table (target).
- Seed data: `database/seed.sql` (roles, admin users, categories incl. land tree, status_master).
- Ownership: each module owns its tables; cross-module changes need an ADR.

## 10. Data Classification & Privacy

| Class | Examples | Handling |
|---|---|---|
| Public | Product listings, categories | Cacheable, CDN |
| Internal | Leads, complaints | Authenticated access |
| PII | Name, email, phone, address, geo | Encrypted at rest (RDS), masked in logs |
| Secrets | Password hashes, tokens | bcrypt; never logged; Redis TTL |
