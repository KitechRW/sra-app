-- ============================================================
-- SECURE RIDE ALLIANCE - Database Schema
-- Version 2.0 - From confirmed design
-- ============================================================

CREATE DATABASE IF NOT EXISTS sradb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sradb;

-- ── USERS (system login) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  UserID       INT AUTO_INCREMENT PRIMARY KEY,
  Name         VARCHAR(100) NOT NULL,
  Email        VARCHAR(150) NOT NULL UNIQUE,
  Password     VARCHAR(255) NOT NULL,
  Role         ENUM('admin','staff') DEFAULT 'staff',
  Phone        VARCHAR(20),
  CreatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── CLIENT (bike owner) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS Client (
  ClientID          INT AUTO_INCREMENT PRIMARY KEY,
  OwnerName         VARCHAR(150) NOT NULL,
  TIN               VARCHAR(50),
  OwnerPhone        VARCHAR(20),
  OwnerEmail        VARCHAR(150),
  OwnerAddress      VARCHAR(200),
  RegistrationNo    VARCHAR(50),
  NumberOfBikes     INT DEFAULT 0,
  CreatedAt         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── BIKES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Bikes (
  BikeID                  INT AUTO_INCREMENT PRIMARY KEY,
  OwnerBikeID             INT NOT NULL,
  BikeModel               VARCHAR(100),
  BikeType                VARCHAR(100),
  BikeChassis             VARCHAR(100) UNIQUE,
  BikePlate               VARCHAR(30) UNIQUE,
  AuthorizationStartDate  DATE,
  AuthorizationEndDate    DATE,
  InsuranceStartDate      DATE,
  InsuranceEndDate        DATE,
  Status                  ENUM('active','inactive','suspended') DEFAULT 'active',
  CreatedAt               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (OwnerBikeID) REFERENCES Client(ClientID) ON DELETE CASCADE
);

-- ── RIDER REGISTRATION ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS RiderRegistration (
  RiderRegistrationID   INT AUTO_INCREMENT PRIMARY KEY,
  BikeID                INT NOT NULL,
  Name                  VARCHAR(150) NOT NULL,
  NationalID            VARCHAR(50) NOT NULL,
  Phone                 VARCHAR(20),
  PermitNumber          VARCHAR(50),
  Status                ENUM('active','inactive') DEFAULT 'active',
  CreatedAt             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (BikeID) REFERENCES Bikes(BikeID) ON DELETE CASCADE
);

-- ── VERSEMENT (Payments) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS Versement (
  VersementID           INT AUTO_INCREMENT PRIMARY KEY,
  BikeID                INT NOT NULL,
  RiderRegistrationID   INT NOT NULL,
  AmountVersement       DECIMAL(12,2) NOT NULL,
  DateTime              DATETIME DEFAULT CURRENT_TIMESTAMP,
  VersementDate         DATE NOT NULL,
  WeekVersement         INT NOT NULL COMMENT 'Week number of the year',
  CreatedAt             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (BikeID) REFERENCES Bikes(BikeID) ON DELETE CASCADE,
  FOREIGN KEY (RiderRegistrationID) REFERENCES RiderRegistration(RiderRegistrationID) ON DELETE CASCADE
);

-- ── INDEXES ─────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS create_index_if_missing;

DELIMITER //
CREATE PROCEDURE create_index_if_missing(
  IN p_table_name VARCHAR(64),
  IN p_index_name VARCHAR(64),
  IN p_index_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name
  ) THEN
    SET @sql = p_index_sql;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//
DELIMITER ;

CALL create_index_if_missing('Bikes', 'idx_bikes_owner', 'CREATE INDEX idx_bikes_owner ON Bikes(OwnerBikeID)');
CALL create_index_if_missing('Bikes', 'idx_bikes_plate', 'CREATE INDEX idx_bikes_plate ON Bikes(BikePlate)');
CALL create_index_if_missing('RiderRegistration', 'idx_rider_bike', 'CREATE INDEX idx_rider_bike ON RiderRegistration(BikeID)');
CALL create_index_if_missing('Versement', 'idx_versement_bike', 'CREATE INDEX idx_versement_bike ON Versement(BikeID)');
CALL create_index_if_missing('Versement', 'idx_versement_rider', 'CREATE INDEX idx_versement_rider ON Versement(RiderRegistrationID)');
CALL create_index_if_missing('Versement', 'idx_versement_date', 'CREATE INDEX idx_versement_date ON Versement(VersementDate)');
CALL create_index_if_missing('Versement', 'idx_versement_week', 'CREATE INDEX idx_versement_week ON Versement(WeekVersement)');

DROP PROCEDURE create_index_if_missing;

-- ── SEED: Admin users ───────────────────────────────────────
INSERT INTO users (Name, Email, Password, Role, Phone) VALUES
  ('Admin SRA', 'admin@secureridealliance.rw', '$2a$10$ZnldBpj0XnLia5x5bWXeS.RvVUfHZks4rePiyFpUgW/9SwNXJcGgu', 'admin', '+250781479282'),
  ('Staff SRA',  'staff@secureridealliance.rw', '$2a$10$WTHyEEnGm49ZCXs7A/0cM./ajIyqHao3tV/71EOhyv/LVzh9M1F9y', 'staff', '+250781000002')
ON DUPLICATE KEY UPDATE UserID=UserID;

-- ── SEED: Clients ───────────────────────────────────────────
INSERT INTO Client (ClientID, OwnerName, TIN, OwnerPhone, OwnerEmail, OwnerAddress, RegistrationNo, NumberOfBikes) VALUES
  (1, 'Jean Paul Niyonzima',  '101234567', '+250781111111', 'jeanpaul@gmail.com',  'Kimironko, Kigali',  'REG-001', 2),
  (2, 'Marie Claire Uwase',   '102345678', '+250782222222', 'marie@gmail.com',     'Remera, Kigali',     'REG-002', 1),
  (3, 'Emmanuel Habimana',    '103456789', '+250783333333', 'emmanuel@gmail.com',  'Nyabugogo, Kigali',  'REG-003', 2)
ON DUPLICATE KEY UPDATE ClientID=ClientID;

-- ── SEED: Bikes ─────────────────────────────────────────────
INSERT INTO Bikes (BikeID, OwnerBikeID, BikeModel, BikeType, BikeChassis, BikePlate, AuthorizationStartDate, AuthorizationEndDate, InsuranceStartDate, InsuranceEndDate, Status) VALUES
  (1, 1, 'Spiro E3',    'Electric',  'CH-SRA-001', 'RAB 734 K', '2024-01-01', '2025-01-01', '2024-01-01', '2025-01-01', 'active'),
  (2, 1, 'Bajaj Boxer', 'Petrol',    'CH-SRA-002', 'RAB 201 G', '2024-01-15', '2025-01-15', '2024-01-15', '2025-01-15', 'active'),
  (3, 2, 'Honda CG125', 'Petrol',    'CH-SRA-003', 'RAB 098 F', '2024-02-01', '2025-02-01', '2024-02-01', '2025-02-01', 'active'),
  (4, 3, 'TVS Star',    'Petrol',    'CH-SRA-004', 'RAB 556 H', '2024-02-15', '2025-02-15', '2024-02-15', '2025-02-15', 'active'),
  (5, 3, 'Spiro E3',    'Electric',  'CH-SRA-005', 'RAB 812 M', '2024-03-01', '2025-03-01', '2024-03-01', '2025-03-01', 'inactive')
ON DUPLICATE KEY UPDATE BikeID=BikeID;

-- ── SEED: Rider Registrations ───────────────────────────────
INSERT INTO RiderRegistration (RiderRegistrationID, BikeID, Name, NationalID, Phone, PermitNumber, Status) VALUES
  (1, 1, 'Alice Uwimana',    '1199880012345678', '+250781234567', 'PERM-001', 'active'),
  (2, 2, 'Bob Nkurunziza',   '1199770034567890', '+250782345678', 'PERM-002', 'active'),
  (3, 3, 'Claire Mukamana',  '1200090045678901', '+250783456789', 'PERM-003', 'active'),
  (4, 4, 'David Habimana',   '1199660056789012', '+250784567890', 'PERM-004', 'active'),
  (5, 5, 'Eve Kagabo',       '1200190023456789', '+250785678901', 'PERM-005', 'inactive')
ON DUPLICATE KEY UPDATE RiderRegistrationID=RiderRegistrationID;

-- ── SEED: Versements ────────────────────────────────────────
INSERT INTO Versement (VersementID, BikeID, RiderRegistrationID, AmountVersement, VersementDate, WeekVersement) VALUES
  (1, 1, 1, 15000, '2024-07-01', 27),
  (2, 1, 1, 15000, '2024-07-08', 28),
  (3, 1, 1, 15000, '2024-07-15', 29),
  (4, 2, 2, 12000, '2024-07-01', 27),
  (5, 2, 2, 12000, '2024-07-08', 28),
  (6, 3, 3, 10000, '2024-07-01', 27),
  (7, 3, 3, 10000, '2024-07-08', 28),
  (8, 4, 4, 12000, '2024-07-01', 27),
  (9, 4, 4, 12000, '2024-07-15', 29)
ON DUPLICATE KEY UPDATE VersementID=VersementID;

SELECT 'SRA Database v2.0 setup complete ✅' AS Message;
