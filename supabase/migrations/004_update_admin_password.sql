-- Update admin user password hash to correct value
-- Password: 'noko2024' hashed with bcrypt (correct hash)
UPDATE admin_users 
SET password_hash = '$2b$10$UDv2svUy4HsEQJofAdJst.uJaNYxPU5R86OtE/WEm54ELpfP2vzgm'
WHERE username = 'admin';