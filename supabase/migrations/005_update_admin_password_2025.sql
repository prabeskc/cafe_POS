-- Update admin user password to noko2025
-- Generated hash: $2b$10$zQ0QiLrdAfsT4.CAWSIb.enXzdFUyq9XPs324bvL0AaY2TMDYsTcS

UPDATE admin_users 
SET password_hash = '$2b$10$zQ0QiLrdAfsT4.CAWSIb.enXzdFUyq9XPs324bvL0AaY2TMDYsTcS'
WHERE username = 'admin';