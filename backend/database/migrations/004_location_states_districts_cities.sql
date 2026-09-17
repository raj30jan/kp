-- KisanPatrika — Migration 004
-- Seeds the Location module (countries -> states -> districts -> cities) so the
-- registration form's cascading dropdowns have real data to select from.
-- Districts/cities below are a STARTER set (one major city per state/UT) —
-- expand via the admin panel or further INSERTs as more coverage is needed.

USE kisanpatrika;

-- =====================================================
-- 1. STATUS MASTER — proper entity types for state/district/city
-- =====================================================

INSERT INTO status_master (entity_type, code, label, color, display_order, is_active) VALUES
  ('state',    'active', 'Active', 'green', 1, 1),
  ('district', 'active', 'Active', 'green', 1, 1),
  ('city',     'active', 'Active', 'green', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- =====================================================
-- 2. STATES — all 28 states + 8 union territories of India
-- =====================================================

INSERT INTO states (country_id, name, code, status_id) VALUES
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Andhra Pradesh',    'AP', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Arunachal Pradesh', 'AR', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Assam',             'AS', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Bihar',             'BR', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Chhattisgarh',      'CG', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Goa',               'GA', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Gujarat',           'GJ', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Haryana',           'HR', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Himachal Pradesh',  'HP', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Jharkhand',         'JH', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Karnataka',         'KA', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Kerala',            'KL', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Madhya Pradesh',    'MP', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Maharashtra',       'MH', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Manipur',           'MN', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Meghalaya',         'ML', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Mizoram',           'MZ', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Nagaland',          'NL', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Odisha',            'OD', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Punjab',            'PB', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Rajasthan',         'RJ', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Sikkim',            'SK', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Tamil Nadu',        'TN', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Telangana',         'TG', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Tripura',           'TR', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Uttar Pradesh',     'UP', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Uttarakhand',       'UK', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'West Bengal',       'WB', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Andaman and Nicobar Islands', 'AN', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Chandigarh',                  'CH', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Dadra and Nagar Haveli and Daman and Diu', 'DN', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Delhi',                       'DL', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Jammu and Kashmir',           'JK', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Ladakh',                      'LA', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Lakshadweep',                 'LD', (SELECT id FROM status_master WHERE entity_type='state' AND code='active')),
  ((SELECT id FROM countries WHERE iso_code_2='IN'), 'Puducherry',                  'PY', (SELECT id FROM status_master WHERE entity_type='state' AND code='active'))
ON DUPLICATE KEY UPDATE code = VALUES(code);

-- =====================================================
-- 3. DISTRICTS — one starter district per state/UT (its major city's district)
-- =====================================================

INSERT INTO districts (state_id, name, status_id)
SELECT s.id, d.name, (SELECT id FROM status_master WHERE entity_type='district' AND code='active')
FROM (
  SELECT 'Andhra Pradesh' AS state_name, 'Visakhapatnam' AS name UNION ALL
  SELECT 'Arunachal Pradesh', 'Papum Pare' UNION ALL
  SELECT 'Assam', 'Kamrup Metropolitan' UNION ALL
  SELECT 'Bihar', 'Patna' UNION ALL
  SELECT 'Chhattisgarh', 'Raipur' UNION ALL
  SELECT 'Goa', 'North Goa' UNION ALL
  SELECT 'Gujarat', 'Ahmedabad' UNION ALL
  SELECT 'Haryana', 'Gurugram' UNION ALL
  SELECT 'Himachal Pradesh', 'Shimla' UNION ALL
  SELECT 'Jharkhand', 'Ranchi' UNION ALL
  SELECT 'Karnataka', 'Bengaluru Urban' UNION ALL
  SELECT 'Kerala', 'Thiruvananthapuram' UNION ALL
  SELECT 'Madhya Pradesh', 'Indore' UNION ALL
  SELECT 'Maharashtra', 'Mumbai' UNION ALL
  SELECT 'Manipur', 'Imphal West' UNION ALL
  SELECT 'Meghalaya', 'East Khasi Hills' UNION ALL
  SELECT 'Mizoram', 'Aizawl' UNION ALL
  SELECT 'Nagaland', 'Kohima' UNION ALL
  SELECT 'Odisha', 'Khordha' UNION ALL
  SELECT 'Punjab', 'Ludhiana' UNION ALL
  SELECT 'Rajasthan', 'Jaipur' UNION ALL
  SELECT 'Sikkim', 'East Sikkim' UNION ALL
  SELECT 'Tamil Nadu', 'Chennai' UNION ALL
  SELECT 'Telangana', 'Hyderabad' UNION ALL
  SELECT 'Tripura', 'West Tripura' UNION ALL
  SELECT 'Uttar Pradesh', 'Lucknow' UNION ALL
  SELECT 'Uttarakhand', 'Dehradun' UNION ALL
  SELECT 'West Bengal', 'Kolkata' UNION ALL
  SELECT 'Andaman and Nicobar Islands', 'South Andaman' UNION ALL
  SELECT 'Chandigarh', 'Chandigarh' UNION ALL
  SELECT 'Dadra and Nagar Haveli and Daman and Diu', 'Daman' UNION ALL
  SELECT 'Delhi', 'New Delhi' UNION ALL
  SELECT 'Jammu and Kashmir', 'Srinagar' UNION ALL
  SELECT 'Ladakh', 'Leh' UNION ALL
  SELECT 'Lakshadweep', 'Lakshadweep' UNION ALL
  SELECT 'Puducherry', 'Puducherry'
) AS d
JOIN states s ON s.name = d.state_name
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- 4. CITIES — one starter city per starter district (same name, major city = district HQ)
-- =====================================================

INSERT INTO cities (district_id, name, status_id)
SELECT dist.id, dist.name, (SELECT id FROM status_master WHERE entity_type='city' AND code='active')
FROM districts dist
WHERE dist.deleted_at IS NULL
ON DUPLICATE KEY UPDATE name = VALUES(name);
