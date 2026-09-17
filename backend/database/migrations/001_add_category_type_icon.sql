-- Migration: Add type, icon, description, is_active columns to categories table
-- Run this if the categories table already exists without these columns.

ALTER TABLE categories
  ADD COLUMN type        VARCHAR(32) NOT NULL DEFAULT 'product' AFTER slug,
  ADD COLUMN icon        VARCHAR(64) NULL AFTER display_order,
  ADD COLUMN description TEXT       NULL AFTER icon,
  ADD COLUMN is_active   TINYINT(1) NOT NULL DEFAULT 1 AFTER description;

ALTER TABLE categories
  ADD INDEX idx_category_type (type),
  ADD INDEX idx_category_active (is_active);
