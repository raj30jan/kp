-- KisanPatrika — Master Data Seed
-- Run after schema.sql to populate reference/status tables.

USE kisanpatrika;

-- =====================================================
-- 1. STATUS MASTER
-- =====================================================

INSERT INTO status_master (entity_type, code, label, color, display_order, is_active) VALUES
  ('user',           'active',       'Active',       'green',   1, 1),
  ('user',           'inactive',     'Inactive',     'gray',    2, 1),
  ('user',           'suspended',    'Suspended',    'red',     3, 1),
  ('user',           'pending',      'Pending',      'yellow',  4, 1),
  ('product',        'draft',        'Draft',        'gray',    1, 1),
  ('product',        'published',    'Published',    'green',   2, 1),
  ('product',        'sold',         'Sold',         'blue',    3, 1),
  ('product',        'expired',      'Expired',      'orange',  4, 1),
  ('product',        'rejected',     'Rejected',     'red',     5, 1),
  ('order',          'pending',      'Pending',      'yellow',  1, 1),
  ('order',          'confirmed',    'Confirmed',    'blue',    2, 1),
  ('order',          'shipped',      'Shipped',      'purple',  3, 1),
  ('order',          'delivered',    'Delivered',    'green',   4, 1),
  ('order',          'cancelled',    'Cancelled',    'red',     5, 1),
  ('offer',          'pending',      'Pending',      'yellow',  1, 1),
  ('offer',          'accepted',     'Accepted',     'green',   2, 1),
  ('offer',          'rejected',     'Rejected',     'red',     3, 1),
  ('offer',          'countered',    'Countered',    'orange',  4, 1),
  ('category',       'active',       'Active',       'green',   1, 1),
  ('category',       'inactive',     'Inactive',     'gray',    2, 1),
  ('contact_type',   'active',       'Active',       'green',   1, 1),
  ('role',           'active',       'Active',       'green',   1, 1),
  ('permission',     'active',       'Active',       'green',   1, 1),
  ('unit',           'active',       'Active',       'green',   1, 1),
  ('country',        'active',       'Active',       'green',   1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- =====================================================
-- 2. CONTACT TYPES
-- =====================================================

INSERT INTO contact_types (code, label, status_id) VALUES
  ('mobile',   'Mobile Number', (SELECT id FROM status_master WHERE entity_type='contact_type' AND code='active')),
  ('email',    'Email Address', (SELECT id FROM status_master WHERE entity_type='contact_type' AND code='active')),
  ('whatsapp', 'WhatsApp',      (SELECT id FROM status_master WHERE entity_type='contact_type' AND code='active')),
  ('landline', 'Landline',      (SELECT id FROM status_master WHERE entity_type='contact_type' AND code='active'))
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- =====================================================
-- 3. UNITS
-- =====================================================

INSERT INTO units (name, code, status_id) VALUES
  ('Kilogram', 'kg',   (SELECT id FROM status_master WHERE entity_type='unit' AND code='active')),
  ('Quintal',  'qtl',  (SELECT id FROM status_master WHERE entity_type='unit' AND code='active')),
  ('Ton',      'ton',  (SELECT id FROM status_master WHERE entity_type='unit' AND code='active')),
  ('Piece',    'pc',   (SELECT id FROM status_master WHERE entity_type='unit' AND code='active')),
  ('Litre',    'ltr',  (SELECT id FROM status_master WHERE entity_type='unit' AND code='active')),
  ('Bag',      'bag',  (SELECT id FROM status_master WHERE entity_type='unit' AND code='active'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- 4. LOCATION (India)
-- =====================================================

INSERT INTO countries (name, iso_code_2, iso_code_3, phone_code, currency_code, status_id) VALUES
  ('India', 'IN', 'IND', '+91', 'INR', (SELECT id FROM status_master WHERE entity_type='country' AND code='active'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO states (country_id, name, code, status_id) VALUES
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Uttar Pradesh', 'UP',   (SELECT id FROM status_master WHERE entity_type='country' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Maharashtra',   'MH',   (SELECT id FROM status_master WHERE entity_type='country' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Punjab',        'PB',   (SELECT id FROM status_master WHERE entity_type='country' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Rajasthan',     'RJ',   (SELECT id FROM status_master WHERE entity_type='country' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Madhya Pradesh','MP',   (SELECT id FROM status_master WHERE entity_type='country' AND code='active'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- 5. ROLES
-- =====================================================

INSERT INTO roles (name, code, description, level, status_id) VALUES
  ('Super Admin',       'super_admin',        'Full platform access',      100, (SELECT id FROM status_master WHERE entity_type='role' AND code='active')),
  ('Platform Admin',    'platform_admin',     'Administrative access',     90,  (SELECT id FROM status_master WHERE entity_type='role' AND code='active')),
  ('State Admin',       'state_admin',        'State level access',        70,  (SELECT id FROM status_master WHERE entity_type='role' AND code='active')),
  ('District Admin',    'district_admin',     'District level access',     60,  (SELECT id FROM status_master WHERE entity_type='role' AND code='active')),
  ('Moderator',         'moderator',          'Moderation access',         50,  (SELECT id FROM status_master WHERE entity_type='role' AND code='active')),
  ('Support Agent',     'support_agent',      'Customer support',          40,  (SELECT id FROM status_master WHERE entity_type='role' AND code='active')),
  ('Merchant',          'merchant',           'Product seller',            30,  (SELECT id FROM status_master WHERE entity_type='role' AND code='active')),
  ('Farmer',            'farmer',             'Individual farmer',         20,  (SELECT id FROM status_master WHERE entity_type='role' AND code='active')),
  ('Buyer',             'buyer',              'Buyer / Consumer',          20,  (SELECT id FROM status_master WHERE entity_type='role' AND code='active')),
  ('Service Provider',  'service_provider',   'Professional services',     20,  (SELECT id FROM status_master WHERE entity_type='role' AND code='active'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- 6. PERMISSIONS (granular)
-- =====================================================

INSERT INTO permissions (name, code, resource, action, status_id) VALUES
  ('Product Create',   'product.create',   'product', 'create',  (SELECT id FROM status_master WHERE entity_type='permission' AND code='active')),
  ('Product Edit',     'product.edit',     'product', 'edit',    (SELECT id FROM status_master WHERE entity_type='permission' AND code='active')),
  ('Product Delete',   'product.delete',   'product', 'delete',  (SELECT id FROM status_master WHERE entity_type='permission' AND code='active')),
  ('Product Approve',  'product.approve',  'product', 'approve', (SELECT id FROM status_master WHERE entity_type='permission' AND code='active')),
  ('Order View',       'order.view',       'order',   'view',    (SELECT id FROM status_master WHERE entity_type='permission' AND code='active')),
  ('Order Edit',       'order.edit',       'order',   'edit',    (SELECT id FROM status_master WHERE entity_type='permission' AND code='active')),
  ('Lead Assign',      'lead.assign',      'lead',    'assign',  (SELECT id FROM status_master WHERE entity_type='permission' AND code='active')),
  ('Chat View',        'chat.view',        'chat',    'view',    (SELECT id FROM status_master WHERE entity_type='permission' AND code='active')),
  ('Report Download',  'report.download',  'report',  'download',(SELECT id FROM status_master WHERE entity_type='permission' AND code='active')),
  ('Government Publish','government.publish','government','publish',(SELECT id FROM status_master WHERE entity_type='permission' AND code='active'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- 7. SAMPLE CATEGORIES
-- =====================================================

INSERT INTO categories (parent_id, level, path, name, name_hi, slug, is_leaf, display_order, status_id) VALUES
  (NULL, 0, 'agriculture/',      'Agriculture',       'कृषि',       'agriculture',       0, 1,  (SELECT id FROM status_master WHERE entity_type='category' AND code='active')),
  (NULL, 0, 'services/',         'Services',          'सेवाएँ',          'services',          0, 2,  (SELECT id FROM status_master WHERE entity_type='category' AND code='active')),
  (NULL, 0, 'equipment/',        'Equipment',         'उपकरण',         'equipment',         0, 3,  (SELECT id FROM status_master WHERE entity_type='category' AND code='active'))
ON DUPLICATE KEY UPDATE name = VALUES(name), name_hi = VALUES(name_hi);
