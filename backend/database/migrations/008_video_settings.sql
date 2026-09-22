-- 008_video_settings.sql
--  (a) One optional video clip per marketplace listing (<= 50 MB, compressed
--      server-side with ffmpeg if the upload is larger).
--  (b) site_settings: key/value store for super-admin managed configuration
--      such as the membership payment QR code / UPI id. Each key is atomic and
--      depends only on the primary key -> 3NF.

ALTER TABLE marketplace_products
  ADD COLUMN video_url VARCHAR(512) NULL AFTER image_urls;

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key   VARCHAR(64)  NOT NULL,
  setting_value TEXT         NULL,
  updated_by    CHAR(36)     NULL,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key),
  CONSTRAINT fk_site_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
  ('membership_qr_url', NULL),
  ('membership_upi_id', NULL),
  ('membership_payee_name', 'KisanPatrika'),
  ('membership_payment_note', 'Scan the QR, pay the plan amount, then submit the UPI transaction reference below. Your membership is activated after our team verifies the payment.');
