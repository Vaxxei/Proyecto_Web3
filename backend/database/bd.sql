CREATE DATABASE IF NOT EXISTS restaurant_reservation;
USE restaurant_reservation;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_email (email),
    INDEX idx_deleted (deleted_at)
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number VARCHAR(50) NOT NULL UNIQUE,
    capacity INT NOT NULL,
    location ENUM('indoor', 'outdoor', 'terrace', 'bar') DEFAULT 'indoor',
    status ENUM('available', 'occupied', 'reserved', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_status (status),
    INDEX idx_deleted (deleted_at)
);

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    guests INT NOT NULL,
    table_id INT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    special_requests TEXT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date (reservation_date),
    INDEX idx_status (status),
    INDEX idx_deleted (deleted_at)
);

INSERT INTO users (name, email, password, role, status)
VALUES (
    'Admin',
    'admin@restaurant.com',
    '$2b$10$gN31wkvTCI7AhPLDyXblWOB5CklG57FFpz03dnWh6WBtGydkck606',
    'admin',
    'active'
);

INSERT INTO restaurant_tables (table_number, capacity, location, status) VALUES
('T1', 2, 'indoor', 'available'),
('T2', 4, 'indoor', 'available'),
('T3', 6, 'indoor', 'available'),
('T4', 4, 'outdoor', 'available'),
('T5', 8, 'outdoor', 'available'),
('T6', 2, 'terrace', 'available'),
('T7', 4, 'terrace', 'available'),
('T8', 6, 'bar', 'available')
ON DUPLICATE KEY UPDATE table_number=table_number;
