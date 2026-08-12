#!/usr/bin/env node
/**
 * ابزار «راه نجات» ساخت / ریست Super Admin
 * -------------------------------------------------
 * مستقل از وضعیت فعلی دیتابیس کار می‌کنه: حتی اگر endpoint
 * /api/auth/setup قبلاً یک‌بار استفاده شده و قفل شده باشه (چون جدول
 * users خالی نیست)، این اسکریپت مستقیماً یک SQL می‌سازه که با همون
 * فرمت هش پسورد اپ (pbkdf2$iterations$salt$hash) سازگاره و می‌تونه
 * یک Super Admin رو با یوزرنیم/پسورد دلخواه بسازه یا ریست کنه.
 *
 * استفاده:
 *   node scripts/create-admin.mjs <username> <password> ["first" "last"]
 *
 * مثال:
 *   node scripts/create-admin.mjs admin "MyStrongPass123!" "Sina" "Dehghan" > seed-admin.sql
 *   wrangler d1 execute bipelak_automation_db --remote --file=./seed-admin.sql
 */
import { randomBytes, pbkdf2Sync, randomUUID } from "node:crypto";

const [, , username, password, firstName = "Super", lastName = "Admin"] = process.argv;

if (!username || !password) {
  console.error('استفاده: node scripts/create-admin.mjs <username> <password> ["first_name" "last_name"]');
  process.exit(1);
}
if (password.length < 8) {
  console.error("رمز عبور باید حداقل ۸ کاراکتر باشد.");
  process.exit(1);
}

// باید دقیقاً با تابع hashPassword در src/index.js یکسان باشه:
// PBKDF2 / SHA-256 / 120000 iteration / خروجی ۲۵۶ بیتی / base64 استاندارد
const ITERATIONS = 120000;
const salt = randomBytes(16);
const derived = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
const passwordHash = `pbkdf2$${ITERATIONS}$${salt.toString("base64")}$${derived.toString("base64")}`;

const userId = `usr_${randomUUID()}`;
const employeeCode = `ADM-${Date.now().toString().slice(-6)}`;
const fullName = `${firstName} ${lastName}`;

function esc(s) {
  return String(s).replace(/'/g, "''");
}

// این SQL ابتدا هر کاربر قبلی با همین username رو حذف می‌کنه (تا تداخل
// UNIQUE پیش نیاد) و بعد Super Admin تازه رو با پسورد جدید می‌سازه.
// اگر می‌خواید کاربر قبلی دست‌نخورده بمونه و فقط یک ادمین جدید اضافه بشه،
// خط DELETE رو حذف کنید و به‌جاش username دیگه‌ای بدید.
const sql = `
DELETE FROM users WHERE username = '${esc(username)}';

INSERT INTO users
  (id, username, email, password_hash, first_name, last_name, full_name, role, department, job_title, employee_code, status)
VALUES
  ('${userId}', '${esc(username)}', NULL, '${passwordHash}', '${esc(firstName)}', '${esc(lastName)}', '${esc(fullName)}', 'Super Admin', 'Management', 'Founder / Super Admin', '${employeeCode}', 'Active');
`.trim() + "\n";

process.stdout.write(sql);
process.stderr.write(`\n✓ SQL برای ساخت/ریست Super Admin آماده شد.\n`);
process.stderr.write(`  یوزرنیم: ${username}\n`);
process.stderr.write(`  این خروجی رو به یک فایل ریدایرکت کنید و با wrangler d1 execute اجرا کنید:\n\n`);
process.stderr.write(`  node scripts/create-admin.mjs "${username}" "***" > seed-admin.sql\n`);
process.stderr.write(`  npx wrangler d1 execute bipelak_automation_db --remote --file=./seed-admin.sql\n\n`);
