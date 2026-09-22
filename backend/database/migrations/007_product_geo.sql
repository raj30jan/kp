-- 007_product_geo.sql — GPS coordinates on marketplace listings.
-- Lets sellers (especially land/property owners) attach the exact plot
-- location so buyers can view it on a map.

ALTER TABLE marketplace_products
  ADD COLUMN latitude  DECIMAL(10,7) NULL AFTER location,
  ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude;
