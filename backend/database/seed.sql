-- Insert local mock data for testing
-- 1. POPULATE SQUADRONS
INSERT INTO squadrons (id) VALUES 
('123vgs'),
('231vgs'),
('321vgs');

-- 2. POPULATE WINCHES
INSERT INTO winches (id, registration, squadron_id) VALUES 
(1, 'G-WNC1', '123vgs'),
(2, 'G-WNC2', '123vgs'),
(3, 'G-WNC3', '231vgs'),
(4, 'G-WNC4', '321vgs');

-- 3. POPULATE OPERATORS
-- (Using unique simulated provider subjects)
INSERT INTO operators (service_no, auth_provider, auth_subject, name, squadron_id, qualification_level) VALUES
('OFF-1001', 'clerk', 'user_joe_bloggs', 'Joe Bloggs', '123vgs', 'examiner'),
('OFF-1002', 'clerk', 'user_sarah_jenkins', 'Sarah Jenkins', '123vgs', 'instructor'),
('SGT-2005', 'clerk', 'user_david_miller', 'David Miller', '123vgs', 'operator'),
('CDT-3042', 'clerk', 'user_emily_clack', 'Emily Clack', '123vgs', 'trainee'),
('OFF-4001', 'clerk', 'user_john_smith', 'John Smith', '321vgs', 'instructor');

-- 4. POPULATE LAUNCHES
-- (The launch_id column will auto-increment automatically)
INSERT INTO launches (launch_number, winch_id, drum, `timestamp`, squadron_id, remarks, operator_sn) VALUES 
(1, 1, 'left', '2026-06-06 09:15:00', '123vgs', 'PLF', 'SGT-2005'),
(1, 1, 'right', '2026-06-06 09:30:00', '123vgs', '', 'OFF-1002'),
(2, 1, 'left', '2026-06-06 10:05:00', '123vgs', '', 'OFF-1002'),
(1, 3, 'right', '2026-06-06 11:00:00', '231vgs', '', 'OFF-4001');

-- 5. POPULATE DAY_LOG
-- (The id column will auto-increment automatically)
INSERT INTO day_log (squadron_id, winch_id, `type`, `timestamp`, operator_sn, trainee, hours) VALUES
('123vgs', 1, 'di', '2026-06-06 08:00:00', 'OFF-1002', NULL, 0.0),
('123vgs', 1, 'sign_on', '2026-06-06 08:30:00', 'SGT-2005', 'CDT-3042', 2.5),
('123vgs', 1, 'finish_day', '2026-06-06 16:30:00', 'OFF-1001', NULL, 6.2);

INSERT INTO day_log (squadron_id, winch_id, `type`, `timestamp`, operator_sn, hours) VALUES
('123vgs', 1, 'cable_check', '2026-06-06 08:00:00', 'OFF-1001', NULL);
