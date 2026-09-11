# KisanPatrika — MySQL Database Design

This folder contains the core relational schema for the KisanPatrika platform.

## Files

- `schema.sql` — Core MySQL DDL for the backend.
- `seed.sql`   — Master data (status, contact types, units, roles, permissions, sample locations/categories).

## Design Principles

- **3NF** for all transactional data.
- **UUIDs** (`CHAR(36)`) as primary keys for public/business entities (`users`, `products`, `orders`, `offers`).
- **BIGINT surrogate keys** for internal/join tables and master-detail rows.
- **Soft delete** via `deleted_at` + `deleted_by` on every table.
- **Audit fields** on every table: `created_by`, `updated_by`, `created_at`, `updated_at`.
- **Status master tables** instead of hardcoded enums (`status_master` is generic and reusable per entity type).
- **Master-detail design** for `addresses`, `contacts`, `images`, `documents`, and `translations` through reusable `entity_*` tables.
- **No comma-separated values or repeated groups**.
- **Foreign keys and indexes** defined inline for referential integrity and query performance.

## Module Coverage

The `schema.sql` file currently covers the foundational modules required for Phase 1:

1. **Master & Audit** — `status_master`, `audit_logs`.
2. **Location** — `countries`, `states`, `districts`, `cities`, `villages`, `postal_codes`, `geo_locations`.
3. **Common Master-Detail** — `addresses`, `contacts`, `images`, `documents`, `translations` plus reusable join tables.
4. **Identity** — `users`, `user_profiles`, `user_devices`, `user_sessions`, `user_preferences`, `user_languages`, `user_social_accounts`, `user_verification`, `user_kyc`.
5. **Security / RBAC** — `roles`, `role_hierarchy`, `permissions`, `permission_groups`, `role_permissions`, `user_roles`, `user_permissions`.
6. **Category** — N-level `categories`, `category_attributes`, `category_attribute_values`.
7. **Product** — `products`, `product_variants`, `product_videos`, `product_prices`, `product_inventory`, `product_attribute_values`, `product_reviews`, `product_views`, `product_favourites`, `product_history`.
8. **Marketplace & Commerce** — `offers`, `offer_history`, `wishlist`, `saved_searches`, `recent_views`, `product_shares`, `orders`, `order_items`, `order_history`.

## How to Apply

```bash
# 1. Create a MySQL database called `kisanpatrika` or run the CREATE DATABASE statement in schema.sql
mysql -u root -p < schema.sql

# 2. Seed master data
mysql -u root -p < seed.sql
```

## Status Master Pattern

Every business table references `status_master` with `entity_type` + `code`.
This allows statuses to evolve without changing the schema or code.

Example:

```sql
SELECT p.*
FROM products p
JOIN status_master s ON p.status_id = s.id
WHERE s.entity_type = 'product' AND s.code = 'published';
```

## Polymorphic Master-Detail Pattern

Images, documents, addresses, and contacts are stored once and linked to any business entity via an `entity_type`/`entity_id` join table.

```sql
-- Example: get all images for a product
SELECT i.*
FROM images i
JOIN entity_images ei ON i.id = ei.image_id
WHERE ei.entity_type = 'product'
  AND ei.entity_id   = '<product-uuid>';
```

## Multilingual Support

Translations are stored in the generic `translations` table. Example:

```sql
SELECT translated_value
FROM translations
WHERE entity_type = 'product'
  AND entity_id   = '<product-uuid>'
  AND language_code = 'hi'
  AND field_name = 'title';
```

## Next Modules to Add

The schema is designed to be extended. Remaining modules that should be added in dedicated files:

- CRM (`leads`, `lead_*`)
- Communication (`chat_rooms`, `chat_messages`, `notifications`, `sms_logs`, `email_logs`)
- Membership (`membership_plans`, `memberships`, `membership_transactions`, `coupons`)
- Professional Services (`service_categories`, `service_providers`, `appointments`)
- Government (`government_schemes`, `scheme_categories`, `scheme_applications`)
- AI (`ai_agents`, `ai_prompts`, `ai_sessions`, `ai_feedback`)
- Content (`blogs`, `news`, `banners`, `cms_pages`, `faq`)
- Payments (`payment_gateway`, `payments`, `refunds`, `transactions`, `invoices`)
- Reporting / Analytics
- Administration

Keep adding tables by following the same patterns: UUIDs for business entities, `status_master` for statuses, `created_by/updated_by/deleted_by/created_at/updated_at/deleted_at` for auditing, and `entity_*` tables for shared master-detail data.
