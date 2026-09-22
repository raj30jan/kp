-- 009_membership_payments.sql
-- Payment ledger for membership fees paid via UPI QR + manual verification.
--
-- Why a separate table (3NF): a subscription is the *entitlement* (plan,
-- start/end); a payment is a *money event* (amount, UTR, who verified it,
-- when, outcome). One subscription may see several payment attempts
-- (rejected UTR, then a correct one) and each attempt must be auditable
-- with its own status and verifier. Keeping them in one row would force
-- repeating groups or overwriting history.

CREATE TABLE IF NOT EXISTS membership_payments (
  id                CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
  subscription_id   CHAR(36)      NULL,
  user_id           CHAR(36)      NOT NULL,
  plan_id           BIGINT        NOT NULL,
  amount            DECIMAL(10,2) NOT NULL DEFAULT 0,
  method            VARCHAR(16)   NOT NULL DEFAULT 'upi',      -- upi | manual (admin grant)
  payment_reference VARCHAR(128)  NULL,                        -- UPI txn id / UTR typed by the member
  status            VARCHAR(16)   NOT NULL DEFAULT 'pending',  -- pending | verified | rejected
  verified_by       CHAR(36)      NULL,                        -- admin user who verified / rejected
  verified_at       TIMESTAMP     NULL,
  remarks           VARCHAR(255)  NULL,                        -- admin note (e.g. reason for rejection)
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mp_user (user_id),
  INDEX idx_mp_status (status),
  INDEX idx_mp_reference (payment_reference),
  INDEX idx_mp_subscription (subscription_id),
  CONSTRAINT fk_mp_subscription FOREIGN KEY (subscription_id) REFERENCES membership_subscriptions (id) ON DELETE SET NULL,
  CONSTRAINT fk_mp_user         FOREIGN KEY (user_id)         REFERENCES users (id),
  CONSTRAINT fk_mp_plan         FOREIGN KEY (plan_id)         REFERENCES membership_plans (id),
  CONSTRAINT fk_mp_verified_by  FOREIGN KEY (verified_by)     REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions now also carry a terminal 'rejected' state (payment not
-- verified) distinct from 'cancelled' (was active, then revoked).
ALTER TABLE membership_subscriptions
  MODIFY COLUMN status VARCHAR(16) NOT NULL DEFAULT 'pending'; -- pending | active | expired | cancelled | rejected

-- Backfill: every existing subscription with a UTR becomes a ledger row so
-- history is complete from day one.
INSERT INTO membership_payments (id, subscription_id, user_id, plan_id, amount, method, payment_reference, status, verified_at, created_at)
SELECT UUID(), s.id, s.user_id, s.plan_id, s.amount,
       IF(s.payment_reference IS NULL, 'manual', 'upi'),
       s.payment_reference,
       CASE s.status WHEN 'pending' THEN 'pending' WHEN 'rejected' THEN 'rejected' ELSE 'verified' END,
       CASE WHEN s.status IN ('pending') THEN NULL ELSE COALESCE(s.start_date, s.updated_at) END,
       s.created_at
FROM membership_subscriptions s
WHERE s.plan_id IN (SELECT id FROM membership_plans WHERE price > 0)
  AND NOT EXISTS (SELECT 1 FROM membership_payments p WHERE p.subscription_id = s.id);
