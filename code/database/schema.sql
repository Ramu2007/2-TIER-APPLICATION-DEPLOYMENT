-- ============================================================
-- 2-Tier Application Database Schema
-- Deployed on: Private EC2 (Tier 2 - MySQL Server)
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS two_tier_app;

-- Create application user with remote access privileges
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON two_tier_app.* TO 'appuser'@'%';
FLUSH PRIVILEGES;

-- Use the database
USE two_tier_app;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
