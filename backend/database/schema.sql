-- KisanPatrika — Core MySQL Schema
-- Design principles: 3NF, UUIDs for business entities, soft delete, audit fields,
-- status master tables, master-detail for addresses/contacts/images/documents/translations.

CREATE DATABASE IF NOT EXISTS kisanpatrika
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kisanpatrika;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. MASTER & AUDIT
-- =====================================================

CREATE TABLE status_master (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type     VARCHAR(64)  NOT NULL,
  code            VARCHAR(64)  NOT NULL,
  label           VARCHAR(128) NOT NULL,
  color           VARCHAR(16)  NULL,
  display_order   INT          NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_status_entity_code (entity_type, code, deleted_at),
  INDEX idx_status_entity (entity_type, is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  table_name      VARCHAR(128) NOT NULL,
  record_id       VARCHAR(64)  NOT NULL,
  action          VARCHAR(32)  NOT NULL,
  old_values      JSON         NULL,
  new_values      JSON         NULL,
  changed_by      CHAR(36)     NULL,
  changed_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address      VARCHAR(64)  NULL,
  user_agent      VARCHAR(512) NULL,
  INDEX idx_audit_table_record (table_name, record_id, changed_at),
  INDEX idx_audit_changed_by (changed_by, changed_at),
  INDEX idx_audit_action (action, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. LOCATION MODULE
-- =====================================================

CREATE TABLE countries (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(128) NOT NULL,
  iso_code_2      CHAR(2)      NOT NULL,
  iso_code_3      CHAR(3)      NULL,
  phone_code      VARCHAR(8)   NULL,
  currency_code   CHAR(3)      NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_country_iso2 (iso_code_2, deleted_at),
  INDEX idx_country_status (status_id),
  CONSTRAINT fk_country_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE states (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  country_id      BIGINT       NOT NULL,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(16)  NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_state_country_name (country_id, name, deleted_at),
  INDEX idx_state_status (status_id),
  CONSTRAINT fk_state_country FOREIGN KEY (country_id) REFERENCES countries (id),
  CONSTRAINT fk_state_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE districts (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  state_id        BIGINT       NOT NULL,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(16)  NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_district_state_name (state_id, name, deleted_at),
  INDEX idx_district_status (status_id),
  CONSTRAINT fk_district_state FOREIGN KEY (state_id) REFERENCES states (id),
  CONSTRAINT fk_district_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cities (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  district_id     BIGINT       NOT NULL,
  name            VARCHAR(128) NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_city_district_name (district_id, name, deleted_at),
  INDEX idx_city_status (status_id),
  CONSTRAINT fk_city_district FOREIGN KEY (district_id) REFERENCES districts (id),
  CONSTRAINT fk_city_status   FOREIGN KEY (status_id)   REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE villages (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  city_id         BIGINT       NOT NULL,
  name            VARCHAR(128) NOT NULL,
  tehsil          VARCHAR(128) NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_village_city_name (city_id, name, deleted_at),
  INDEX idx_village_status (status_id),
  CONSTRAINT fk_village_city   FOREIGN KEY (city_id)   REFERENCES cities (id),
  CONSTRAINT fk_village_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE postal_codes (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  city_id         BIGINT       NOT NULL,
  code            VARCHAR(16)  NOT NULL,
  area_name       VARCHAR(128) NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_postal_city_code (city_id, code, deleted_at),
  INDEX idx_postal_status (status_id),
  CONSTRAINT fk_postal_city   FOREIGN KEY (city_id)   REFERENCES cities (id),
  CONSTRAINT fk_postal_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE geo_locations (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type     VARCHAR(64)  NOT NULL,
  entity_id       CHAR(36)     NOT NULL,
  latitude        DECIMAL(10,8) NOT NULL,
  longitude       DECIMAL(11,8) NOT NULL,
  accuracy        DECIMAL(8,2)  NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_geo_entity (entity_type, entity_id),
  INDEX idx_geo_status (status_id),
  CONSTRAINT fk_geo_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. COMMON MASTER-DETAIL TABLES
-- =====================================================

CREATE TABLE addresses (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  line_1          VARCHAR(255) NOT NULL,
  line_2          VARCHAR(255) NULL,
  landmark        VARCHAR(255) NULL,
  village_id      BIGINT       NULL,
  city_id         BIGINT       NULL,
  district_id     BIGINT       NULL,
  state_id        BIGINT       NULL,
  country_id      BIGINT       NULL,
  postal_code_id  BIGINT       NULL,
  latitude        DECIMAL(10,8) NULL,
  longitude       DECIMAL(11,8) NULL,
  address_type    VARCHAR(32)  NULL,
  is_primary      TINYINT(1)   NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_address_city (city_id),
  INDEX idx_address_state (state_id),
  INDEX idx_address_country (country_id),
  INDEX idx_address_status (status_id),
  CONSTRAINT fk_address_village     FOREIGN KEY (village_id)     REFERENCES villages (id),
  CONSTRAINT fk_address_city        FOREIGN KEY (city_id)        REFERENCES cities (id),
  CONSTRAINT fk_address_district    FOREIGN KEY (district_id)    REFERENCES districts (id),
  CONSTRAINT fk_address_state       FOREIGN KEY (state_id)       REFERENCES states (id),
  CONSTRAINT fk_address_country     FOREIGN KEY (country_id)     REFERENCES countries (id),
  CONSTRAINT fk_address_postal      FOREIGN KEY (postal_code_id) REFERENCES postal_codes (id),
  CONSTRAINT fk_address_status      FOREIGN KEY (status_id)      REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE entity_addresses (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type     VARCHAR(64)  NOT NULL,
  entity_id       CHAR(36)     NOT NULL,
  address_id      BIGINT       NOT NULL,
  address_type    VARCHAR(32)  NULL,
  is_primary      TINYINT(1)   NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_entity_address (entity_type, entity_id, address_id, deleted_at),
  INDEX idx_entity_addr_entity (entity_type, entity_id),
  CONSTRAINT fk_entity_addr_address FOREIGN KEY (address_id) REFERENCES addresses (id),
  CONSTRAINT fk_entity_addr_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_types (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(64)  NOT NULL,
  label           VARCHAR(128) NOT NULL,
  icon            VARCHAR(128) NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_contact_type_code (code, deleted_at),
  CONSTRAINT fk_contact_type_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contacts (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  contact_type_id BIGINT       NOT NULL,
  value           VARCHAR(255) NOT NULL,
  is_primary      TINYINT(1)   NOT NULL DEFAULT 0,
  is_verified     TINYINT(1)   NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_contact_type_value (contact_type_id, value),
  CONSTRAINT fk_contact_type      FOREIGN KEY (contact_type_id) REFERENCES contact_types (id),
  CONSTRAINT fk_contact_status    FOREIGN KEY (status_id)       REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE entity_contacts (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type     VARCHAR(64)  NOT NULL,
  entity_id       CHAR(36)     NOT NULL,
  contact_id      BIGINT       NOT NULL,
  is_primary      TINYINT(1)   NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_entity_contact (entity_type, entity_id, contact_id, deleted_at),
  INDEX idx_entity_contact_entity (entity_type, entity_id),
  CONSTRAINT fk_entity_contact_contact FOREIGN KEY (contact_id) REFERENCES contacts (id),
  CONSTRAINT fk_entity_contact_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE images (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  file_name       VARCHAR(255) NULL,
  original_url    VARCHAR(512) NOT NULL,
  thumbnail_url   VARCHAR(512) NULL,
  mime_type       VARCHAR(64)  NULL,
  file_size       INT          NULL,
  display_order   INT          NOT NULL DEFAULT 0,
  is_primary      TINYINT(1)   NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_image_status (status_id),
  CONSTRAINT fk_image_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE entity_images (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type     VARCHAR(64)  NOT NULL,
  entity_id       CHAR(36)     NOT NULL,
  image_id        BIGINT       NOT NULL,
  display_order   INT          NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_entity_image (entity_type, entity_id, image_id, deleted_at),
  INDEX idx_entity_image_entity (entity_type, entity_id),
  CONSTRAINT fk_entity_image_image FOREIGN KEY (image_id) REFERENCES images (id),
  CONSTRAINT fk_entity_image_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE documents (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  document_type   VARCHAR(64)  NOT NULL,
  file_name       VARCHAR(255) NOT NULL,
  file_url        VARCHAR(512) NOT NULL,
  mime_type       VARCHAR(64)  NULL,
  file_size       INT          NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_doc_status (status_id),
  CONSTRAINT fk_doc_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE entity_documents (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type     VARCHAR(64)  NOT NULL,
  entity_id       CHAR(36)     NOT NULL,
  document_id     BIGINT       NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_entity_document (entity_type, entity_id, document_id, deleted_at),
  INDEX idx_entity_doc_entity (entity_type, entity_id),
  CONSTRAINT fk_entity_doc_document FOREIGN KEY (document_id) REFERENCES documents (id),
  CONSTRAINT fk_entity_doc_status    FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE translations (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type     VARCHAR(64)  NOT NULL,
  entity_id       CHAR(36)     NOT NULL,
  language_code   CHAR(5)      NOT NULL,
  field_name      VARCHAR(64)  NOT NULL,
  translated_value TEXT        NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_translation (entity_type, entity_id, language_code, field_name, deleted_at),
  INDEX idx_translation_entity (entity_type, entity_id),
  CONSTRAINT fk_translation_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. IDENTITY MODULE
-- =====================================================

CREATE TABLE users (
  id              CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  email           VARCHAR(128) NULL,
  mobile          VARCHAR(20)  NULL,
  password_hash   VARCHAR(255) NULL,
  display_name    VARCHAR(128) NULL,
  status_id       BIGINT       NOT NULL,
  is_verified     TINYINT(1)   NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  role            VARCHAR(20)  NOT NULL DEFAULT 'user', -- user | admin | super_admin (RBAC + dashboard routing)
  free_listings_used INT       NOT NULL DEFAULT 0, -- lifetime count of products sold (free-tier cap = 5)
  free_contacts_used INT       NOT NULL DEFAULT 0, -- lifetime count of seller-contact reveals (free-tier cap = 5)
  email_verified_at TIMESTAMP  NULL,
  mobile_verified_at TIMESTAMP NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_user_email (email, deleted_at),
  UNIQUE KEY uq_user_mobile (mobile, deleted_at),
  INDEX idx_user_status (status_id),
  INDEX idx_user_role (role),
  CONSTRAINT fk_user_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_profiles (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  first_name      VARCHAR(128) NULL,
  last_name       VARCHAR(128) NULL,
  gender          VARCHAR(16)  NULL,
  dob             DATE         NULL,
  avatar_url      VARCHAR(512) NULL,
  bio             TEXT         NULL,
  primary_language CHAR(5)     NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_user_profile_user (user_id, deleted_at),
  CONSTRAINT fk_user_profile_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_user_profile_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_devices (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  device_id       VARCHAR(255) NOT NULL,
  device_type     VARCHAR(32)  NULL,
  os              VARCHAR(64)  NULL,
  os_version      VARCHAR(32)  NULL,
  app_version     VARCHAR(32)  NULL,
  fcm_token       VARCHAR(512) NULL,
  last_login_at   TIMESTAMP    NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_device_user (user_id),
  INDEX idx_device_id (device_id),
  CONSTRAINT fk_user_device_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_user_device_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_sessions (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  token           VARCHAR(512) NOT NULL,
  refresh_token   VARCHAR(512) NULL,
  ip_address      VARCHAR(64)  NULL,
  user_agent      VARCHAR(512) NULL,
  expires_at      TIMESTAMP    NOT NULL,
  revoked_at      TIMESTAMP    NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_session_user (user_id),
  INDEX idx_session_token (token(255)),
  INDEX idx_session_expires (expires_at),
  CONSTRAINT fk_user_session_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_user_session_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_preferences (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  preference_key  VARCHAR(128) NOT NULL,
  preference_value TEXT        NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_user_pref (user_id, preference_key, deleted_at),
  CONSTRAINT fk_user_pref_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_user_pref_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_languages (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  language_code   CHAR(5)      NOT NULL,
  is_primary      TINYINT(1)   NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_user_language (user_id, language_code, deleted_at),
  CONSTRAINT fk_user_lang_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_user_lang_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_social_accounts (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  provider        VARCHAR(64)  NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  access_token    VARCHAR(512) NULL,
  refresh_token   VARCHAR(512) NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_social_provider (provider, provider_user_id, deleted_at),
  INDEX idx_social_user (user_id),
  CONSTRAINT fk_user_social_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_user_social_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_verification (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  verification_type VARCHAR(64) NOT NULL,
  otp             VARCHAR(16)  NULL,
  expires_at      TIMESTAMP    NOT NULL,
  verified_at     TIMESTAMP    NULL,
  attempts        INT          NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_verify_user (user_id, verification_type),
  CONSTRAINT fk_user_verify_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_user_verify_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_kyc (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  kyc_type        VARCHAR(64)  NOT NULL,
  kyc_number      VARCHAR(128) NULL,
  verified_by     CHAR(36)     NULL,
  verified_at     TIMESTAMP    NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_user_kyc (user_id, kyc_type, deleted_at),
  CONSTRAINT fk_user_kyc_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_user_kyc_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. SECURITY / RBAC
-- =====================================================

CREATE TABLE roles (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(64)  NOT NULL,
  description     VARCHAR(255) NULL,
  level           INT          NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_role_code (code, deleted_at),
  CONSTRAINT fk_role_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_hierarchy (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_role_id  BIGINT       NOT NULL,
  child_role_id   BIGINT       NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_role_hierarchy (parent_role_id, child_role_id, deleted_at),
  CONSTRAINT fk_role_hier_parent FOREIGN KEY (parent_role_id) REFERENCES roles (id),
  CONSTRAINT fk_role_hier_child  FOREIGN KEY (child_role_id)  REFERENCES roles (id),
  CONSTRAINT fk_role_hier_status FOREIGN KEY (status_id)      REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(128) NOT NULL,
  resource        VARCHAR(64)  NOT NULL,
  action          VARCHAR(32)  NOT NULL,
  description     VARCHAR(255) NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_permission_code (code, deleted_at),
  INDEX idx_permission_resource (resource, action),
  CONSTRAINT fk_permission_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permission_groups (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(64)  NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_perm_group_code (code, deleted_at),
  CONSTRAINT fk_perm_group_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permission_group_permissions (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id        BIGINT       NOT NULL,
  permission_id   BIGINT       NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_group_perm (group_id, permission_id, deleted_at),
  CONSTRAINT fk_group_perm_group      FOREIGN KEY (group_id)      REFERENCES permission_groups (id),
  CONSTRAINT fk_group_perm_permission FOREIGN KEY (permission_id) REFERENCES permissions (id),
  CONSTRAINT fk_group_perm_status     FOREIGN KEY (status_id)     REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  role_id         BIGINT       NOT NULL,
  permission_id   BIGINT       NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_role_perm (role_id, permission_id, deleted_at),
  CONSTRAINT fk_role_perm_role       FOREIGN KEY (role_id)       REFERENCES roles (id),
  CONSTRAINT fk_role_perm_permission FOREIGN KEY (permission_id) REFERENCES permissions (id),
  CONSTRAINT fk_role_perm_status     FOREIGN KEY (status_id)     REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  role_id         BIGINT       NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_user_role (user_id, role_id, deleted_at),
  CONSTRAINT fk_user_role_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_user_role_role   FOREIGN KEY (role_id)   REFERENCES roles (id),
  CONSTRAINT fk_user_role_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_permissions (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  permission_id   BIGINT       NOT NULL,
  granted         TINYINT(1)   NOT NULL DEFAULT 1,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_user_perm (user_id, permission_id, deleted_at),
  CONSTRAINT fk_user_perm_user       FOREIGN KEY (user_id)       REFERENCES users (id),
  CONSTRAINT fk_user_perm_permission FOREIGN KEY (permission_id) REFERENCES permissions (id),
  CONSTRAINT fk_user_perm_status     FOREIGN KEY (status_id)     REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. CATEGORY MODULE (N-LEVEL)
-- =====================================================

CREATE TABLE categories (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_id       BIGINT       NULL,
  level           INT          NOT NULL DEFAULT 0,
  path            VARCHAR(500) NOT NULL,
  name            VARCHAR(128) NOT NULL,
  slug            VARCHAR(128) NOT NULL,
  is_leaf         TINYINT(1)   NOT NULL DEFAULT 0,
  display_order   INT          NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_category_slug (slug, deleted_at),
  INDEX idx_category_parent (parent_id),
  INDEX idx_category_level (level, is_leaf, display_order),
  INDEX idx_category_status (status_id),
  CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories (id),
  CONSTRAINT fk_category_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE category_attributes (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_id     BIGINT       NOT NULL,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(64)  NOT NULL,
  data_type       VARCHAR(32)  NOT NULL,
  is_required     TINYINT(1)   NOT NULL DEFAULT 0,
  display_order   INT          NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_cat_attr_code (category_id, code, deleted_at),
  INDEX idx_cat_attr_category (category_id),
  CONSTRAINT fk_cat_attr_category FOREIGN KEY (category_id) REFERENCES categories (id),
  CONSTRAINT fk_cat_attr_status   FOREIGN KEY (status_id)   REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE category_attribute_values (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  attribute_id    BIGINT       NOT NULL,
  value           VARCHAR(255) NOT NULL,
  display_order   INT          NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_cat_attr_val_attr (attribute_id),
  CONSTRAINT fk_cat_attr_val_attr  FOREIGN KEY (attribute_id) REFERENCES category_attributes (id),
  CONSTRAINT fk_cat_attr_val_status FOREIGN KEY (status_id)   REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. PRODUCT MODULE
-- =====================================================

CREATE TABLE units (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(64)  NOT NULL,
  code            VARCHAR(32)  NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_unit_code (code, deleted_at),
  CONSTRAINT fk_unit_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tags (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(128) NOT NULL,
  slug            VARCHAR(128) NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_tag_slug (slug, deleted_at),
  CONSTRAINT fk_tag_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id              CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  owner_id        CHAR(36)     NOT NULL,
  owner_type      VARCHAR(32)  NOT NULL,
  category_id     BIGINT       NOT NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT         NULL,
  price           DECIMAL(15,2) NULL,
  quantity        DECIMAL(15,3) NULL,
  unit_id         BIGINT       NULL,
  is_negotiable   TINYINT(1)   NOT NULL DEFAULT 0,
  city_id         BIGINT       NULL,
  state_id        BIGINT       NULL,
  country_id      BIGINT       NULL,
  latitude        DECIMAL(10,8) NULL,
  longitude       DECIMAL(11,8) NULL,
  published_at    TIMESTAMP    NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_product_owner (owner_id, owner_type),
  INDEX idx_product_category (category_id),
  INDEX idx_product_location (state_id, city_id),
  INDEX idx_product_status (status_id),
  INDEX idx_product_price (price),
  INDEX idx_product_published (published_at),
  FULLTEXT INDEX idx_product_title_desc (title, description),
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories (id),
  CONSTRAINT fk_product_unit     FOREIGN KEY (unit_id)     REFERENCES units (id),
  CONSTRAINT fk_product_city     FOREIGN KEY (city_id)     REFERENCES cities (id),
  CONSTRAINT fk_product_state    FOREIGN KEY (state_id)    REFERENCES states (id),
  CONSTRAINT fk_product_country  FOREIGN KEY (country_id)  REFERENCES countries (id),
  CONSTRAINT fk_product_status   FOREIGN KEY (status_id)   REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_variants (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id      CHAR(36)     NOT NULL,
  sku             VARCHAR(128) NULL,
  title           VARCHAR(255) NOT NULL,
  price           DECIMAL(15,2) NULL,
  quantity        DECIMAL(15,3) NULL,
  unit_id         BIGINT       NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_variant_product (product_id),
  CONSTRAINT fk_variant_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_variant_unit    FOREIGN KEY (unit_id)    REFERENCES units (id),
  CONSTRAINT fk_variant_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_videos (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id      CHAR(36)     NOT NULL,
  video_url       VARCHAR(512) NOT NULL,
  display_order   INT          NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_video_product (product_id),
  CONSTRAINT fk_video_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_video_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_prices (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id      CHAR(36)     NOT NULL,
  variant_id      BIGINT       NULL,
  price           DECIMAL(15,2) NOT NULL,
  currency        CHAR(3)      NOT NULL DEFAULT 'INR',
  effective_from  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to    TIMESTAMP    NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_price_product (product_id),
  INDEX idx_price_effective (effective_from, effective_to),
  CONSTRAINT fk_price_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_price_variant FOREIGN KEY (variant_id)  REFERENCES product_variants (id),
  CONSTRAINT fk_price_status  FOREIGN KEY (status_id)   REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_inventory (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id      CHAR(36)     NOT NULL,
  variant_id      BIGINT       NULL,
  quantity        DECIMAL(15,3) NOT NULL,
  unit_id         BIGINT       NULL,
  warehouse_id    BIGINT       NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_inv_product (product_id),
  CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_inv_variant FOREIGN KEY (variant_id)  REFERENCES product_variants (id),
  CONSTRAINT fk_inv_unit    FOREIGN KEY (unit_id)     REFERENCES units (id),
  CONSTRAINT fk_inv_status  FOREIGN KEY (status_id)   REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_attribute_values (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id      CHAR(36)     NOT NULL,
  attribute_id    BIGINT       NOT NULL,
  value           VARCHAR(512) NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_product_attr (product_id, attribute_id, deleted_at),
  CONSTRAINT fk_prod_attr_product   FOREIGN KEY (product_id)   REFERENCES products (id),
  CONSTRAINT fk_prod_attr_attribute FOREIGN KEY (attribute_id) REFERENCES category_attributes (id),
  CONSTRAINT fk_prod_attr_status    FOREIGN KEY (status_id)    REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_reviews (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id      CHAR(36)     NOT NULL,
  reviewer_id     CHAR(36)     NOT NULL,
  rating          DECIMAL(2,1) NOT NULL,
  review_text     TEXT         NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_review_product (product_id),
  INDEX idx_review_reviewer (reviewer_id),
  CONSTRAINT fk_review_product  FOREIGN KEY (product_id)  REFERENCES products (id),
  CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id),
  CONSTRAINT fk_review_status   FOREIGN KEY (status_id)   REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_views (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id      CHAR(36)     NOT NULL,
  viewer_id       CHAR(36)     NULL,
  viewer_type     VARCHAR(32)  NULL,
  ip_address      VARCHAR(64)  NULL,
  viewed_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_view_product (product_id),
  INDEX idx_view_viewer (viewer_id, viewer_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_favourites (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  product_id      CHAR(36)     NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_fav_user_product (user_id, product_id, deleted_at),
  CONSTRAINT fk_fav_user    FOREIGN KEY (user_id)    REFERENCES users (id),
  CONSTRAINT fk_fav_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_fav_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_history (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id      CHAR(36)     NOT NULL,
  field_name      VARCHAR(64)  NOT NULL,
  old_value       TEXT         NULL,
  new_value       TEXT         NULL,
  changed_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prod_hist_product (product_id, created_at),
  CONSTRAINT fk_prod_hist_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. MARKETPLACE & COMMERCE CORE
-- =====================================================

CREATE TABLE offers (
  id              CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  product_id      CHAR(36)     NOT NULL,
  buyer_id        CHAR(36)     NOT NULL,
  offered_price   DECIMAL(15,2) NOT NULL,
  offered_quantity DECIMAL(15,3) NULL,
  message         TEXT         NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_offer_product (product_id),
  INDEX idx_offer_buyer (buyer_id),
  CONSTRAINT fk_offer_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_offer_buyer   FOREIGN KEY (buyer_id)   REFERENCES users (id),
  CONSTRAINT fk_offer_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE offer_history (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  offer_id        CHAR(36)     NOT NULL,
  status_id       BIGINT       NOT NULL,
  notes           TEXT         NULL,
  created_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_offer_hist_offer (offer_id),
  CONSTRAINT fk_offer_hist_offer  FOREIGN KEY (offer_id)  REFERENCES offers (id),
  CONSTRAINT fk_offer_hist_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wishlist (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  product_id      CHAR(36)     NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_wishlist (user_id, product_id, deleted_at),
  CONSTRAINT fk_wishlist_user    FOREIGN KEY (user_id)    REFERENCES users (id),
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_wishlist_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE saved_searches (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  name            VARCHAR(128) NULL,
  query_params    JSON         NOT NULL,
  alert_enabled   TINYINT(1)   NOT NULL DEFAULT 0,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_saved_search_user (user_id),
  CONSTRAINT fk_saved_search_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_saved_search_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recent_views (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         CHAR(36)     NOT NULL,
  product_id      CHAR(36)     NOT NULL,
  viewed_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_recent_user (user_id, viewed_at),
  CONSTRAINT fk_recent_user    FOREIGN KEY (user_id)    REFERENCES users (id),
  CONSTRAINT fk_recent_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_recent_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_shares (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id      CHAR(36)     NOT NULL,
  shared_by       CHAR(36)     NOT NULL,
  channel         VARCHAR(64)  NULL,
  shared_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_share_product (product_id),
  CONSTRAINT fk_share_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_share_user    FOREIGN KEY (shared_by)  REFERENCES users (id),
  CONSTRAINT fk_share_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id              CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  buyer_id        CHAR(36)     NOT NULL,
  seller_id       CHAR(36)     NOT NULL,
  order_number    VARCHAR(64)  NOT NULL,
  total_amount    DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency        CHAR(3)      NOT NULL DEFAULT 'INR',
  shipping_address_id BIGINT   NULL,
  billing_address_id  BIGINT   NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_order_number (order_number, deleted_at),
  INDEX idx_order_buyer (buyer_id),
  INDEX idx_order_seller (seller_id),
  INDEX idx_order_status (status_id),
  CONSTRAINT fk_order_buyer    FOREIGN KEY (buyer_id)  REFERENCES users (id),
  CONSTRAINT fk_order_seller   FOREIGN KEY (seller_id) REFERENCES users (id),
  CONSTRAINT fk_order_ship_addr FOREIGN KEY (shipping_address_id) REFERENCES addresses (id),
  CONSTRAINT fk_order_bill_addr FOREIGN KEY (billing_address_id)  REFERENCES addresses (id),
  CONSTRAINT fk_order_status   FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id        CHAR(36)     NOT NULL,
  product_id      CHAR(36)     NOT NULL,
  variant_id      BIGINT       NULL,
  quantity        DECIMAL(15,3) NOT NULL,
  unit_id         BIGINT       NULL,
  unit_price      DECIMAL(15,2) NOT NULL,
  total_price     DECIMAL(15,2) NOT NULL,
  status_id       BIGINT       NOT NULL,
  created_by      CHAR(36)     NULL,
  updated_by      CHAR(36)     NULL,
  deleted_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_order_item_order (order_id),
  INDEX idx_order_item_product (product_id),
  CONSTRAINT fk_order_item_order   FOREIGN KEY (order_id)   REFERENCES orders (id),
  CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_order_item_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id),
  CONSTRAINT fk_order_item_unit    FOREIGN KEY (unit_id)    REFERENCES units (id),
  CONSTRAINT fk_order_item_status  FOREIGN KEY (status_id)  REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_history (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id        CHAR(36)     NOT NULL,
  status_id       BIGINT       NOT NULL,
  notes           TEXT         NULL,
  created_by      CHAR(36)     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_hist_order (order_id, created_at),
  CONSTRAINT fk_order_hist_order  FOREIGN KEY (order_id)  REFERENCES orders (id),
  CONSTRAINT fk_order_hist_status FOREIGN KEY (status_id) REFERENCES status_master (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SERVICE INTEREST HISTORY
-- Records which service a visitor/user selected on the home page, tagged with
-- a browser session id, so the support/calling team can follow up and guide
-- them (buy/sell/hire etc.). Works for guests too (user_id nullable).
-- ============================================================================
CREATE TABLE service_interest_history (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id      VARCHAR(64)  NOT NULL,
  user_id         CHAR(36)     NULL,
  mobile          VARCHAR(15)  NULL,
  service_code    VARCHAR(64)  NOT NULL,
  service_name    VARCHAR(128) NOT NULL,
  source_page     VARCHAR(64)  NULL,
  contact_status  VARCHAR(32)  NOT NULL DEFAULT 'PENDING', -- PENDING | CONTACTED | GUIDED | CLOSED
  contacted_by    CHAR(36)     NULL,
  contacted_at    TIMESTAMP    NULL,
  notes           TEXT         NULL,
  ip_address      VARCHAR(64)  NULL,
  user_agent      VARCHAR(512) NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sih_session (session_id),
  INDEX idx_sih_user (user_id),
  INDEX idx_sih_mobile (mobile),
  INDEX idx_sih_status (contact_status),
  INDEX idx_sih_created (created_at),
  CONSTRAINT fk_sih_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MARKETPLACE / BUY-SELL MODULE
-- NOTE: table named `marketplace_products` (not `products`) because a
-- pre-existing generic classifieds `products` table already occupies
-- that name earlier in this schema (owner_id/category_id/status_id based).
-- =====================================================

CREATE TABLE marketplace_products (
  id              CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  seller_id       CHAR(36)     NULL,
  title           VARCHAR(255) NOT NULL, -- may be entered in seller's local language
  description     TEXT         NULL,
  category        VARCHAR(64)  NOT NULL, -- seeds, tools, fertilizers, livestock, crops, vegetables, fruits, dairy, other
  sub_category    VARCHAR(64)  NULL,
  price           DECIMAL(15,2) NOT NULL,
  price_unit      VARCHAR(32)  NOT NULL DEFAULT 'per_kg', -- per_kg, per_piece, per_quintal, per_litre
  quantity        DECIMAL(12,3) NULL,
  quantity_unit   VARCHAR(32)  NULL,
  location        VARCHAR(255) NULL,
  state           VARCHAR(64)  NULL,
  district        VARCHAR(64)  NULL,
  mobile          VARCHAR(20)  NULL,
  email           VARCHAR(128) NULL,
  image_urls      JSON         NULL, -- [{ full: '/uploads/...', thumb: '/uploads/...' }, ...]
  status          VARCHAR(32)  NOT NULL DEFAULT 'pending', -- pending (awaiting admin approval), active, expired, rejected, deleted
  activated_at    TIMESTAMP    NULL,       -- when admin approved / seller reactivated
  expires_at      TIMESTAMP    NULL,       -- activated_at + 15 days; auto-expired by cron after this
  views           BIGINT       NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mp_seller (seller_id),
  INDEX idx_mp_category (category),
  INDEX idx_mp_status (status),
  INDEX idx_mp_location (state, district),
  INDEX idx_mp_created (created_at),
  INDEX idx_mp_expires (expires_at),
  CONSTRAINT fk_mp_seller FOREIGN KEY (seller_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Buyer "contact reveal" = our proxy for a purchase interaction, since this
-- is an OLX-style contact marketplace with no cart/checkout. Each row also
-- counts toward the buyer's lifetime free-tier limit (5) via
-- users.free_contacts_used.
CREATE TABLE product_contacts (
  id              CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  product_id      CHAR(36)     NOT NULL,
  buyer_id        CHAR(36)     NOT NULL,
  seller_id       CHAR(36)     NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pc_product_buyer (product_id, buyer_id),
  INDEX idx_pc_buyer (buyer_id),
  INDEX idx_pc_seller (seller_id),
  CONSTRAINT fk_pc_product FOREIGN KEY (product_id) REFERENCES marketplace_products (id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_buyer FOREIGN KEY (buyer_id) REFERENCES users (id),
  CONSTRAINT fk_pc_seller FOREIGN KEY (seller_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MEMBERSHIP / SUBSCRIPTION MODULE
-- =====================================================

CREATE TABLE membership_plans (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(32)  NOT NULL UNIQUE, -- 'free', 'quarterly'
  name                VARCHAR(64)  NOT NULL,
  price               DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_cycle       VARCHAR(16)  NOT NULL DEFAULT 'lifetime', -- lifetime | quarterly
  duration_days       INT          NULL, -- NULL for free/lifetime plan
  free_listing_limit  INT          NULL, -- NULL = unlimited (paid); 5 for free plan
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO membership_plans (code, name, price, billing_cycle, duration_days, free_listing_limit)
VALUES
  ('free', 'Free Plan', 0.00, 'lifetime', NULL, 5),
  ('quarterly', 'Quarterly Membership', 100.00, 'quarterly', 90, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);

CREATE TABLE membership_subscriptions (
  id                CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  user_id           CHAR(36)     NOT NULL,
  plan_id           BIGINT       NOT NULL,
  status            VARCHAR(16)  NOT NULL DEFAULT 'pending', -- pending | active | expired | cancelled
  start_date        TIMESTAMP    NULL,
  end_date          TIMESTAMP    NULL,
  amount            DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_reference VARCHAR(128) NULL, -- TODO: populated once a real gateway (Razorpay/Stripe) is wired
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ms_user (user_id),
  INDEX idx_ms_status (status),
  CONSTRAINT fk_ms_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_ms_plan FOREIGN KEY (plan_id) REFERENCES membership_plans (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMPLAINTS / LEGAL MODULE
-- =====================================================

CREATE TABLE complaints (
  id               CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  user_id          CHAR(36)     NULL, -- NULL allowed for guest complaints
  category         VARCHAR(32)  NOT NULL, -- legal | terms | policy | fraud | other
  subject          VARCHAR(255) NOT NULL,
  description      TEXT         NOT NULL,
  contact_mobile   VARCHAR(20)  NULL,
  contact_email    VARCHAR(128) NULL,
  status           VARCHAR(20)  NOT NULL DEFAULT 'open', -- open | in_review | resolved | rejected
  resolution_note  TEXT         NULL,
  resolved_by      CHAR(36)     NULL,
  resolved_at      TIMESTAMP    NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_complaints_status (status),
  INDEX idx_complaints_user (user_id),
  INDEX idx_complaints_category (category),
  CONSTRAINT fk_complaints_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
