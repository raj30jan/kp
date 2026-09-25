-- 013_service_provider_aadhaar_verify.sql
-- Store the result of offline Aadhaar secure-QR signature verification.
--   aadhaar_verified  'verified' | 'unverified' | 'no_qr' | NULL
--   aadhaar_name      name decoded from the QR (admin cross-check vs listing)

ALTER TABLE `service_providers`
  ADD COLUMN `aadhaar_verified` VARCHAR(16)  NULL AFTER `aadhaar_url`,
  ADD COLUMN `aadhaar_name`     VARCHAR(255) NULL AFTER `aadhaar_verified`;
