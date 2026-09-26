-- ============================================================
-- 2-Tier Application Sample Seed Data
-- ============================================================

USE two_tier_app;

INSERT INTO users (username, password) VALUES
('admin', 'admin123'),
('demo_user', 'demo_password')
ON DUPLICATE KEY UPDATE username=username;
