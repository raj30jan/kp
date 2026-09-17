USE kisanpatrika;

-- Add Hindi name columns for categories and products
ALTER TABLE categories
  ADD COLUMN name_hi VARCHAR(128) NULL AFTER name;

ALTER TABLE marketplace_products
  ADD COLUMN title_hi VARCHAR(255) NULL AFTER title;

-- Sample category Hindi names
UPDATE categories SET name_hi = 'कृषि'      WHERE name = 'Agriculture';
UPDATE categories SET name_hi = 'सेवाएँ'   WHERE name = 'Services';
UPDATE categories SET name_hi = 'उपकरण'    WHERE name = 'Equipment';

-- Set product Hindi titles manually, for example:
-- UPDATE marketplace_products SET title_hi = 'गेहूँ के बीज' WHERE title = 'Premium Wheat Seeds';
