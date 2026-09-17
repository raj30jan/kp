-- KisanPatrika — Migration 005
-- Adds all 22 districts of Haryana + one headquarter city per district,
-- so selecting Haryana in the state dropdown shows the full district list.

USE kisanpatrika;

SET @haryana_id = (SELECT id FROM states WHERE name = 'Haryana');
SET @active_state_status = (SELECT id FROM status_master WHERE entity_type='state' AND code='active');
SET @active_district_status = (SELECT id FROM status_master WHERE entity_type='district' AND code='active');
SET @active_city_status = (SELECT id FROM status_master WHERE entity_type='city' AND code='active');

INSERT INTO districts (state_id, name, code, status_id) VALUES
  (@haryana_id, 'Ambala',       NULL, @active_district_status),
  (@haryana_id, 'Bhiwani',      NULL, @active_district_status),
  (@haryana_id, 'Charkhi Dadri',NULL, @active_district_status),
  (@haryana_id, 'Faridabad',    NULL, @active_district_status),
  (@haryana_id, 'Fatehabad',    NULL, @active_district_status),
  (@haryana_id, 'Gurugram',     NULL, @active_district_status),
  (@haryana_id, 'Hisar',        NULL, @active_district_status),
  (@haryana_id, 'Jhajjar',      NULL, @active_district_status),
  (@haryana_id, 'Jind',         NULL, @active_district_status),
  (@haryana_id, 'Kaithal',      NULL, @active_district_status),
  (@haryana_id, 'Karnal',       NULL, @active_district_status),
  (@haryana_id, 'Kurukshetra',  NULL, @active_district_status),
  (@haryana_id, 'Mahendragarh', NULL, @active_district_status),
  (@haryana_id, 'Nuh',          NULL, @active_district_status),
  (@haryana_id, 'Palwal',       NULL, @active_district_status),
  (@haryana_id, 'Panchkula',    NULL, @active_district_status),
  (@haryana_id, 'Panipat',      NULL, @active_district_status),
  (@haryana_id, 'Rewari',       NULL, @active_district_status),
  (@haryana_id, 'Rohtak',       NULL, @active_district_status),
  (@haryana_id, 'Sirsa',        NULL, @active_district_status),
  (@haryana_id, 'Sonipat',      NULL, @active_district_status),
  (@haryana_id, 'Yamunanagar',  NULL, @active_district_status)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- One city per district (headquarter city / district-name city)
INSERT INTO cities (district_id, name, status_id)
SELECT d.id, d.name, @active_city_status
FROM districts d
WHERE d.state_id = @haryana_id
  AND d.deleted_at IS NULL
ON DUPLICATE KEY UPDATE name = VALUES(name);
