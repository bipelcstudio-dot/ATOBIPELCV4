# BIPELC OS — نسخه یکپارچه

این نسخه بر اساس ساختار فعلی مخزن `bipelcstudio-dot/bipelc-ato` ساخته شده و قابلیت‌های اصلی موردنیاز را در یک معماری واحد جمع می‌کند:

- React + Vite frontend
- Cloudflare Worker + Hono API
- D1 database
- Login/session authentication
- Role-based employee accounts
- Employee creation
- Dashboard
- Projects
- Internal chat
- Leave / purchase / internal tickets
- Finance transactions
- Audit log

## نصب

```bash
npm install
npm run build
```

## دیتابیس

اگر دیتابیس فعلی‌ات همان `bipelak_automation_db` است، قبل از اجرای schema فعلی خودت را نابود نکن. این فایل `schema.sql` فقط نسخه مینیمال سازگار برای این build است.

برای یک دیتابیس خالی:

```bash
npm run db:init
```

اگر D1 فعلی‌ات از قبل جدول‌ها را دارد، **schema.sql را دوباره کورکورانه اجرا نکن**؛ ابتدا backup بگیر.

## Deploy

```bash
npm run deploy
```

## اولین ورود

وقتی جدول `users` خالی باشد، endpoint زیر فقط یک بار قابل استفاده است:

`POST /api/auth/setup`

Body:

```json
{
  "username": "admin",
  "password": "یک رمز حداقل ۸ کاراکتری",
  "first_name": "Sina",
  "last_name": "Dehghan",
  "email": "admin@example.com"
}
```

بعد از ساخته‌شدن اولین کاربر، setup خودکار قفل می‌شود.

## نکته

برای استفاده با دیتابیس فعلی پروژه، `wrangler.toml` همین binding موجود پروژه را نگه داشته است:
`DB -> bipelak_automation_db`.

اگر Cloudflare پروژه‌ات از قبل به همین D1 وصل است، آن را تغییر نده.

## ⚠️ ساخت / ریست اضطراری Super Admin (اگر لاگین کار نمی‌کند)

اگر جدول `users` قبلاً یک بار پر شده (مثلاً `setup` یک‌بار زده شده ولی رمز آن یادتان
رفته، یا یک تست ناقص باعث شده کاربری بدون رمز درست ساخته شود)، دیگر endpoint
`/api/auth/setup` کار نمی‌کند (چون فقط وقتی جدول خالی است فعال است) و راهی برای
ورود نیست. برای همین یک اسکریپت مستقل اضافه شده که مستقیم روی D1 کار می‌کند و
به هیچ‌کدام از این محدودیت‌ها وابسته نیست:

```bash
node scripts/create-admin.mjs "admin" "یک-رمز-قوی-حداقل-۸-کاراکتری" "نام" "نام‌خانوادگی" > seed-admin.sql
npx wrangler d1 execute bipelak_automation_db --remote --file=./seed-admin.sql
```

این کار یک کاربر `Super Admin` با همان یوزرنیم/پسوردی که دادید می‌سازد (اگر از قبل
همان یوزرنیم وجود داشته باشد، حذف و جایگزین می‌شود) — هش پسورد دقیقاً با همان
فرمتی تولید می‌شود که بک‌اند (`src/index.js`) انتظار دارد، پس بلافاصله قابل ورود است.

## باگ‌هایی که در این نسخه رفع شد

1. **جدول `users` خالی بود و هیچ کاربر پیش‌فرضی نداشت** → دلیل اصلی «لاگین نمی‌شود»
   برای نصب تازه. راه‌حل: صفحه‌ی «راه‌اندازی اولیه سیستم» در Login و/یا
   `scripts/create-admin.mjs` برای ساخت دستی.
2. **نبود proxy در `vite.config.js` برای حالت توسعه** → وقتی پروژه با
   `npm run dev` (فقط Vite) اجرا می‌شد، درخواست‌های `/api/*` به بک‌اند Worker
   نمی‌رسیدند و به‌جایش HTML خود Vite برمی‌گشت. چون فرانت‌اند خطای JSON را
   بی‌صدا نادیده می‌گرفت، فرم لاگین/راه‌اندازی بدون هیچ پیغامی «هیچ اتفاقی
   نمی‌افتاد». رفع شد با اضافه‌کردن `server.proxy` به `vite.config.js` (باید
   موازی با آن `npx wrangler dev` هم در ترمینال دیگر اجرا شود) + اصلاح
   `src/client/api.js` تا این حالت را با پیغام خطای واضح گزارش کند به‌جای
   قورت‌دادن بی‌صدای آن.
