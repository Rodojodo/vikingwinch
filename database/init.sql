CREATE TABLE squadrons (
    id VARCHAR(50) PRIMARY KEY
);

CREATE TABLE winches (
    id INT PRIMARY KEY,
    registration VARCHAR(50) NOT NULL,
    squadron_id VARCHAR(50) NOT NULL,
    CONSTRAINT fk_winches_squadron FOREIGN KEY (squadron_id) REFERENCES squadrons(id) ON DELETE NO ACTION
);


CREATE TABLE operators (
    service_no VARCHAR(20) PRIMARY KEY,
    entra_oid CHAR(36) UNIQUE, 
    name VARCHAR(255) NOT NULL,
    squadron_id VARCHAR(50) NOT NULL,
    qualification_level ENUM('trainee', 'operator', 'instructor', 'examiner') NOT NULL,
    CONSTRAINT fk_operators_squadron FOREIGN KEY (squadron_id) REFERENCES squadrons(id) ON DELETE NO ACTION
);



CREATE TABLE launches (
  launch_number INT NOT NULL AUTO_INCREMENT,
  winch_id INT NOT NULL,
  drum VARCHAR(255) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL,
  squadron_id VARCHAR(50) NOT NULL,
  remarks TEXT NULL,
  operator_id VARCHAR(20) NULL,
  
  PRIMARY KEY (launch_number),
  CONSTRAINT launches_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES operators (service_no) ON UPDATE CASCADE,
  CONSTRAINT launches_squadron_id_fkey FOREIGN KEY (squadron_id) REFERENCES squadrons (id),
  CONSTRAINT launches_winch_id_fkey FOREIGN KEY (winch_id) REFERENCES winches (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE day_log (
  id INT NOT NULL AUTO_INCREMENT,
  squadron_id VARCHAR(50) NOT NULL,
  winch_id INT NOT NULL,
  `type` ENUM('finish_day', 'di', 'sign_on') NOT NULL,
  `timestamp` TIMESTAMP NULL,
  left_drum INT NULL,
  right_drum INT NULL,
  operator_id VARCHAR(20) NOT NULL,
  trainee VARCHAR(20) NULL,
  cable_check VARCHAR(20) NOT NULL,
  hours FLOAT NOT NULL,


  PRIMARY KEY (id),
  CONSTRAINT day_log_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES operators (service_no) ON UPDATE CASCADE,
  CONSTRAINT day_log_trainee_fkey FOREIGN KEY (trainee) REFERENCES operators (service_no),
  CONSTRAINT day_log_cable_check_fkey FOREIGN KEY (cable_check) REFERENCES operators (service_no),
  CONSTRAINT day_log_squadron_id_fkey FOREIGN KEY (squadron_id) REFERENCES squadrons (id),
  CONSTRAINT day_log_winch_id_fkey FOREIGN KEY (winch_id) REFERENCES winches (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;






-- Insert local mock data for testing
-- 1. POPULATE SQUADRONS
INSERT INTO squadrons (id) VALUES 
('VGS-321'),
('VGS-231'),
('VGS-123');

-- 2. POPULATE WINCHES
INSERT INTO winches (id, registration, squadron_id) VALUES 
(1, 'G-WNC1', 'VGS-321'),
(2, 'G-WNC2', 'VGS-321'),
(3, 'G-WNC3', 'VGS-231'),
(4, 'G-WNC4', 'VGS-123');

-- 3. POPULATE OPERATORS
-- (Using unique simulated Entra OIDs / UUIDs)  
INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES 
('OFF-1001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'John Smith', 'VGS-321', 'examiner'),
('OFF-1002', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Sarah Jenkins', 'VGS-321', 'instructor'),
('SGT-2005', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'David Miller', 'VGS-321', 'operator'),
('CDT-3042', 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Emily Clack', 'VGS-321', 'trainee'),
('OFF-4001', 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'Joe Bloggs', 'VGS-123', 'instructor');

-- 4. POPULATE LAUNCHES
-- (The launch_number column will auto-increment automatically)
INSERT INTO launches (winch_id, drum, `timestamp`, squadron_id, remarks, operator_id) VALUES 
(1, 'Left Drum', '2026-06-06 09:15:00', 'VGS-321', 'PLF', 'SGT-2005'),
(1, 'Right Drum', '2026-06-06 09:30:00', 'VGS-321', '', 'OFF-1002'),
(1, 'Left Drum', '2026-06-06 10:05:00', 'VGS-321', '', 'OFF-1002'),
(3, 'Left Drum', '2026-06-06 11:00:00', 'VGS-231', '', 'OFF-4001');

-- 5. POPULATE DAY_LOG
-- (The id column will auto-increment automatically)
INSERT INTO day_log (squadron_id, winch_id, `type`, `timestamp`, left_drum, right_drum, operator_id, trainee, cable_check, hours) VALUES 
('VGS-321', 1, 'di', '2026-06-06 08:00:00', 0, 0, 'OFF-1002', NULL, 'OFF-1001', 0.0),
('VGS-321', 1, 'sign_on', '2026-06-06 08:30:00', 12, 12, 'SGT-2005', 'CDT-3042', 'OFF-1002', 2.5),
('VGS-321', 1, 'finish_day', '2026-06-06 16:30:00', 25, 22, 'OFF-1001', NULL, 'OFF-1002', 6.2);