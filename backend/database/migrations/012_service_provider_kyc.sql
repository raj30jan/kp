-- 012_service_provider_kyc.sql
-- KYC / profile fields for service providers:
--   experience_years  total years of experience (required at create)
--   address           full address line (required at create)
--   aadhaar_url       Aadhaar card upload (mandatory at create, admin-visible)
--   resume_url        resume / CV upload (optional)
-- latitude/longitude already existed; the offer form now captures them.

ALTER TABLE `service_providers`
  ADD COLUMN `experience_years` INT          NULL AFTER `mobile`,
  ADD COLUMN `address`          TEXT         NULL AFTER `experience_years`,
  ADD COLUMN `aadhaar_url`      VARCHAR(512) NULL AFTER `address`,
  ADD COLUMN `resume_url`       VARCHAR(512) NULL AFTER `aadhaar_url`;
