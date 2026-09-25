-- 014_service_provider_pincode.sql
-- PIN code for service providers — shown in the listing table so users can
-- confirm the provider's exact area.

ALTER TABLE `service_providers`
  ADD COLUMN `pincode` VARCHAR(10) NULL AFTER `state`;
