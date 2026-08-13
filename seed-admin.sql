-- After migrations, generate a SHA-256 hash of your chosen password and replace HASH below.
-- Example with browser console: await crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PASSWORD'))
INSERT OR IGNORE INTO users (id,username,password_hash,full_name,role,status) VALUES ('admin-001','admin','HASH','مدیر بی‌پلک','Super Admin','Active');
