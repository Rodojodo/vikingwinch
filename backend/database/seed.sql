-- Insert local mock data for testing
-- 1. POPULATE SQUADRONS
INSERT INTO squadrons (id) VALUES 
('123 VGS'),
('231 VGS'),
('321 VGS');

-- 2. POPULATE WINCHES
INSERT INTO winches (id, registration, squadron_id) VALUES 
(1, 'G-WNC1', '123 VGS'),
(2, 'G-WNC2', '123 VGS'),
(3, 'G-WNC3', '231 VGS'),
(4, 'G-WNC4', '321 VGS');

-- 3. POPULATE OPERATORS
-- (Using unique simulated Entra OIDs / UUIDs)  
INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES 
('OFF-1001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Joe Bloggs', '123 VGS', 'examiner'),
('OFF-1002', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Sarah Jenkins', '123 VGS', 'instructor'),
('SGT-2005', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'David Miller', '123 VGS', 'operator'),
('CDT-3042', 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Emily Clack', '123 VGS', 'trainee'),
('OFF-4001', 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'John Smith', '321 VGS', 'instructor');

-- 4. POPULATE LAUNCHES
-- (The launch_id column will auto-increment automatically)
INSERT INTO launches (launch_number, winch_id, drum, `timestamp`, squadron_id, remarks, operator_sn) VALUES 
(1, 1, 'left', '2026-06-06 09:15:00', '123 VGS', 'PLF', 'SGT-2005'),
(1, 1, 'right', '2026-06-06 09:30:00', '123 VGS', '', 'OFF-1002'),
(2, 1, 'left', '2026-06-06 10:05:00', '123 VGS', '', 'OFF-1002'),
(1, 3, 'right', '2026-06-06 11:00:00', '231 VGS', '', 'OFF-4001');

-- 5. POPULATE DAY_LOG
-- (The id column will auto-increment automatically)
INSERT INTO day_log (squadron_id, winch_id, `type`, `timestamp`, left_drum, right_drum, operator_sn, trainee, cable_check, hours) VALUES 
('123 VGS', 1, 'di', '2026-06-06 08:00:00', 0, 0, 'OFF-1002', NULL, 'OFF-1001', 0.0),
('123 VGS', 1, 'sign_on', '2026-06-06 08:30:00', 12, 12, 'SGT-2005', 'CDT-3042', 'OFF-1002', 2.5),
('123 VGS', 1, 'finish_day', '2026-06-06 16:30:00', 25, 22, 'OFF-1001', NULL, 'OFF-1002', 6.2);