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
