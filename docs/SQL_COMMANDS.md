# SQL / Data-Store Commands — KisanPatrika

MySQL, MongoDB and Redis commands for operating the features shipped in
this release: agriculture-land listings with video, email-OTP login,
role-based paywall exemption (`agent`), UPI-QR membership with manual UTR
verification, and `site_settings`. Table/column names match
`backend/database/schema.sql` and `backend/database/migrations/00*.sql`.

Connect (values from `backend/.env`):

```bash
cd backend && set -a && . ./.env && set +a
mysql -h "$MYSQL_HOST" -P "${MYSQL_PORT:-3306}" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"
```

---

## 1. Migrations

```bash
# Apply the migrations added for this release, in order
for f in 006_farms 007_product_geo 008_video_settings; do
  mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < database/migrations/$f.sql && echo "applied $f"
done
```

```sql
-- Verify 008 landed
SHOW COLUMNS FROM marketplace_products LIKE 'video_url';
SHOW CREATE TABLE site_settings\G
SELECT * FROM site_settings;
```

## 2. Roles & paywall exemption

```sql
-- Role distribution
SELECT role, COUNT(*) AS users FROM users WHERE deleted_at IS NULL GROUP BY role;

-- Promote a user to agent (exempt from the 5-listing cap and contact paywall)
UPDATE users SET role = 'agent' WHERE mobile = '9999999999';

-- Create / promote a super admin (only super_admin can manage roles + payment QR)
UPDATE users SET role = 'super_admin' WHERE email = 'owner@kisanpatrika.in';

-- Free-tier usage per user (cap = 5 lifetime listings; contacts need paid access)
SELECT id, mobile, role, free_listings_used, free_contacts_used
FROM users WHERE role = 'user' ORDER BY free_listings_used DESC LIMIT 20;

-- Reset a user's free counters (support action)
UPDATE users SET free_listings_used = 0, free_contacts_used = 0 WHERE id = '<uuid>';
```

## 3. Membership — UPI QR + manual UTR verification

```sql
-- Plans on offer
SELECT id, code, name, price, billing_cycle, duration_days, is_active FROM membership_plans;

-- Payments awaiting verification (what the admin panel badge counts)
SELECT s.id, u.mobile, p.code AS plan, s.amount, s.payment_reference AS utr, s.created_at
FROM membership_subscriptions s
JOIN users u ON u.id = s.user_id
JOIN membership_plans p ON p.id = s.plan_id
WHERE s.status = 'pending'
ORDER BY s.created_at;

-- Manually approve a pending subscription (mirrors MembershipService.approveSubscription)
UPDATE membership_subscriptions s
JOIN membership_plans p ON p.id = s.plan_id
SET s.status = 'active',
    s.start_date = NOW(),
    s.end_date = IF(p.duration_days IS NULL, NULL, DATE_ADD(NOW(), INTERVAL p.duration_days DAY))
WHERE s.id = <sub_id> AND s.status = 'pending';

-- Reject a pending subscription
UPDATE membership_subscriptions SET status = 'rejected' WHERE id = <sub_id> AND status = 'pending';

-- Who currently has paid access via subscription
SELECT u.mobile, p.code, s.start_date, s.end_date
FROM membership_subscriptions s
JOIN users u ON u.id = s.user_id
JOIN membership_plans p ON p.id = s.plan_id
WHERE s.status = 'active' AND (s.end_date IS NULL OR s.end_date > NOW());

-- Duplicate UTR check (same reference submitted twice)
SELECT payment_reference, COUNT(*) c FROM membership_subscriptions
WHERE payment_reference IS NOT NULL GROUP BY payment_reference HAVING c > 1;

-- Payment QR / UPI settings shown on /membership (super-admin managed)
SELECT setting_key, setting_value, updated_by, updated_at FROM site_settings
WHERE setting_key LIKE 'membership_%';

-- Set UPI id directly (normally done via /admin/settings)
UPDATE site_settings SET setting_value = 'kisanpatrika@upi' WHERE setting_key = 'membership_upi_id';
```

## 4. Marketplace — land listings, video, contact gating

```sql
-- Latest agriculture-land listings (home page "newly added" row shows top 20)
SELECT id, title, price, price_unit, quantity, quantity_unit, state, district, status, created_at
FROM marketplace_products
WHERE category = 'land' AND status = 'active' AND deleted_at IS NULL
ORDER BY created_at DESC LIMIT 20;

-- Large parcels (> 10 acres), as served by /marketplace/products/land/large-parcels
SELECT id, title, quantity, quantity_unit, state FROM marketplace_products
WHERE category = 'land' AND status = 'active' AND quantity_unit = 'acre' AND quantity > 10;

-- Listings with a video, and pending review queue
SELECT id, title, category, video_url FROM marketplace_products WHERE video_url IS NOT NULL;
SELECT id, title, category, seller_id, created_at FROM marketplace_products WHERE status = 'pending' ORDER BY created_at;

-- Units in use vs the units master (anything odd here means old rows predate validation)
SELECT quantity_unit, COUNT(*) FROM marketplace_products GROUP BY quantity_unit;
SELECT price_unit,    COUNT(*) FROM marketplace_products GROUP BY price_unit;

-- Listings missing a mobile (mandatory since this release — should be 0 for new rows)
SELECT COUNT(*) FROM marketplace_products WHERE mobile IS NULL OR mobile = '';

-- Contact reveals (paid feature) — who contacted whom
SELECT c.product_id, b.mobile AS buyer, s.mobile AS seller, c.created_at
FROM product_contacts c
JOIN users b ON b.id = c.buyer_id
LEFT JOIN users s ON s.id = c.seller_id
ORDER BY c.created_at DESC LIMIT 50;

-- Super-admin "full erase" of a listing's contact data
UPDATE marketplace_products SET mobile = NULL, email = NULL WHERE id = '<product_uuid>';

-- Wishlist / cart buckets
SELECT type, COUNT(*) FROM product_interests GROUP BY type;
```

## 5. Farms

```sql
SELECT u.mobile, f.name, f.area, f.area_unit, f.crop, f.state, f.district
FROM farms f JOIN users u ON u.id = f.user_id
ORDER BY f.created_at DESC LIMIT 20;
```

## 6. Redis — OTP & sessions

```bash
redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"}
```

```text
KEYS login-otp:*                      # active 2FA login challenges
GET  login-otp:<challengeId>          # {"userId":..,"otp":"123456","attempts":0}
TTL  login-otp:<challengeId>
KEYS login-otp-throttle:*             # users inside the 60s resend window
DEL  login-otp-throttle:<userId>      # lift throttle for a user (support)
KEYS otp:*                            # registration / guest mobile OTPs
KEYS blacklist:*                      # logged-out JWTs
DBSIZE
```

## 7. MongoDB — activity log (if `MONGO_ENABLED=true`)

```bash
mongosh "$MONGO_URI"
```

```js
// Login 2FA events
db.activity_logs.find({ action: { $in: ['auth.login', 'auth.login.otp_sent'] } }).sort({ timestamp: -1 }).limit(20)

// Listings created with a video
db.activity_logs.find({ action: 'product.create', 'meta.hasVideo': true }).sort({ timestamp: -1 }).limit(20)

// Contact reveals per day
db.activity_logs.aggregate([
  { $match: { action: 'product.contact' } },
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, n: { $sum: 1 } } },
  { $sort: { _id: -1 } }, { $limit: 14 }
])
```

## 8. Integrity checks

```sql
-- FK sanity: subscriptions pointing at missing users/plans
SELECT COUNT(*) FROM membership_subscriptions s LEFT JOIN users u ON u.id = s.user_id WHERE u.id IS NULL;
SELECT COUNT(*) FROM membership_subscriptions s LEFT JOIN membership_plans p ON p.id = s.plan_id WHERE p.id IS NULL;

-- Products whose seller no longer exists
SELECT COUNT(*) FROM marketplace_products m LEFT JOIN users u ON u.id = m.seller_id WHERE u.id IS NULL;

-- Expired-but-still-active listings (cron should keep this at 0)
SELECT COUNT(*) FROM marketplace_products WHERE status = 'active' AND expires_at < NOW();
```
