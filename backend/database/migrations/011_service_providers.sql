-- 011_service_providers.sql
-- Service-provider listings (hire labour, machinery, vets, patwari,
-- loan/subsidy agents, transport). Separate from marketplace_products —
-- services have rates (per day/hour/acre/visit) instead of price+quantity,
-- and no stock. Same lifecycle: pending -> active -> expired / rejected.
-- Nothing goes live without admin approval.

CREATE TABLE IF NOT EXISTS `service_providers` (
  `id`            CHAR(36)      NOT NULL,
  `provider_id`   CHAR(36)      NULL COMMENT 'users.id of the listing owner',
  `service_type`  VARCHAR(64)   NOT NULL COMMENT 'labour | machinery | veterinary | patwari | loan_agent | transport | other',
  `title`         VARCHAR(255)  NOT NULL,
  `title_hi`      VARCHAR(255)  NULL,
  `description`   TEXT          NULL,
  `rate`          DECIMAL(15,2) NULL COMMENT 'NULL = negotiable / on call',
  `rate_unit`     VARCHAR(32)   NOT NULL DEFAULT 'per_day' COMMENT 'per_day | per_hour | per_acre | per_visit | per_month | fixed | negotiable',
  `mobile`        VARCHAR(20)   NOT NULL,
  `village`       VARCHAR(128)  NULL,
  `tehsil`        VARCHAR(64)   NULL,
  `district`      VARCHAR(64)   NULL,
  `state`         VARCHAR(64)   NULL,
  `latitude`      DECIMAL(10,7) NULL,
  `longitude`     DECIMAL(10,7) NULL,
  `image_urls`    JSON          NULL COMMENT 'photos / certificates / vehicle pics',
  `status`        VARCHAR(32)   NOT NULL DEFAULT 'pending' COMMENT 'pending | active | expired | rejected',
  `activated_at`  TIMESTAMP     NULL,
  `expires_at`    TIMESTAMP     NULL,
  `views`         BIGINT        NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sp_provider` (`provider_id`),
  KEY `idx_sp_type_status` (`service_type`, `status`),
  KEY `idx_sp_status` (`status`),
  KEY `idx_sp_district` (`district`, `state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
