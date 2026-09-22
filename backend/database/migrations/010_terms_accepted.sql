-- 010_terms_accepted.sql
-- Records when a user accepted the Terms & Conditions at registration.
-- Legal audit trail for the "platform is not responsible for faulty
-- products/services" disclaimer shown on the register form.

ALTER TABLE `users`
  ADD COLUMN `terms_accepted_at` TIMESTAMP NULL DEFAULT NULL
  COMMENT 'When the user accepted the Terms & Conditions at registration'
  AFTER `mobile_verified_at`;
