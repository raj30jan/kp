-- Migration 003: Social login, product edit history, engagement (like/dislike)
-- tracking, and the email/SMS notification system.
-- Run manually against the target database (see database/README.md).

-- =====================================================
-- Social login is already supported by `user_social_accounts`
-- (see schema.sql). No table changes needed there — this migration
-- only adds the pieces that did not previously exist.
-- =====================================================

-- Full change history for marketplace product edits (mirrors `product_history`
-- but points at `marketplace_products`, the table actually used by the
-- OLX-style marketplace). Every field change made by a seller (or admin) is
-- recorded here so nothing is ever silently lost, and the title can be
-- audited even though sellers are not allowed to change it themselves.
CREATE TABLE IF NOT EXISTS marketplace_product_history (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id      CHAR(36)     NOT NULL,
  field_name      VARCHAR(64)  NOT NULL,
  old_value       TEXT         NULL,
  new_value       TEXT         NULL,
  changed_by      CHAR(36)     NULL,
  changed_by_role VARCHAR(20)  NULL, -- 'user' | 'admin' | 'super_admin'
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mp_hist_product (product_id, created_at),
  CONSTRAINT fk_mp_hist_product FOREIGN KEY (product_id) REFERENCES marketplace_products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One like/dislike per (product, user). Changing your mind updates the row
-- instead of inserting a duplicate.
CREATE TABLE IF NOT EXISTS product_reactions (
  id              CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  product_id      CHAR(36)     NOT NULL,
  user_id         CHAR(36)     NOT NULL,
  reaction        ENUM('like','dislike') NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reaction_product_user (product_id, user_id),
  INDEX idx_reaction_product (product_id),
  CONSTRAINT fk_reaction_product FOREIGN KEY (product_id) REFERENCES marketplace_products (id) ON DELETE CASCADE,
  CONSTRAINT fk_reaction_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Every notification actually delivered (or attempted) to an end-user,
-- whichever channel was used. Lets a user's dashboard show "you were
-- notified about X on Y".
CREATE TABLE IF NOT EXISTS notifications (
  id              CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  user_id         CHAR(36)     NOT NULL,
  channel         ENUM('email','sms','app') NOT NULL,
  type            VARCHAR(64)  NOT NULL, -- product.like, product.dislike, product.contact, product.edit, feedback, etc.
  title           VARCHAR(255) NOT NULL,
  message         TEXT         NOT NULL,
  related_type    VARCHAR(64)  NULL,     -- e.g. 'marketplace_product'
  related_id      CHAR(36)     NULL,
  status          ENUM('sent','failed','skipped') NOT NULL DEFAULT 'skipped',
  is_read         TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mirror of every notification event for the admin panel, so admins stay
-- aware of every like/dislike/contact/feedback across the platform without
-- having to query per-user notification rows.
CREATE TABLE IF NOT EXISTS admin_notifications (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  type            VARCHAR(64)  NOT NULL,
  message         TEXT         NOT NULL,
  related_type    VARCHAR(64)  NULL,
  related_id      CHAR(36)     NULL,
  target_user_id  CHAR(36)     NULL, -- the user the notification was about/sent to
  is_read         TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_notif_created (created_at),
  INDEX idx_admin_notif_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
