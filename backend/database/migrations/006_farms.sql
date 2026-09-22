-- Farm plots owned by a user — powers the "My Farm" page.
-- Each row is one plot/parcel the farmer manages (distinct from marketplace
-- listings, which are for sale). Strictly scoped to owner_id.

CREATE TABLE farms (
  id              CHAR(36)       PRIMARY KEY DEFAULT (UUID()),
  owner_id        CHAR(36)       NOT NULL,
  name            VARCHAR(128)   NOT NULL,
  area            DECIMAL(10,2)  NULL,
  area_unit       VARCHAR(16)    DEFAULT 'acres',
  location        VARCHAR(255)   NULL,
  state           VARCHAR(64)    NULL,
  district        VARCHAR(64)    NULL,
  crop            VARCHAR(128)   NULL,
  soil_type       VARCHAR(64)    NULL,
  irrigation      VARCHAR(64)    NULL,
  sown_date       DATE           NULL,
  expected_harvest DATE          NULL,
  notes           TEXT           NULL,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP      NULL,
  CONSTRAINT fk_farm_owner FOREIGN KEY (owner_id) REFERENCES users (id),
  INDEX idx_farm_owner (owner_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
