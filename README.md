# BIPELC OS v5

نسخه بازطراحی‌شده سیستم اتوماسیون بی‌پلک برای Cloudflare Workers + D1.

## امکانات
- Dashboard مدیریتی با درآمد، پروژه فعال/عقب‌افتاده، مشتریان، هزینه، سود، بدهی و پرداخت نزدیک
- CRM مشتریان + وضعیت فروش + امتیاز + پرونده ارتباطی
- Projects + Tasks
- Employee panel و Permission اختصاصی هر کارمند
- HR: حضور و غیاب، مرخصی، ارزیابی
- Freelancer network + پروفایل و امتیازدهی دیتابیسی
- Legal: قرارداد مشتری/فریلنسر/همکاری
- Finance + invoice + گزارش سود
- Requests/tickets
- Internal chat
- Reports
- Session auth و authorization سمت Backend

## نصب
1. در Cloudflare یک D1 بساز.
2. مقدار `database_id` در `wrangler.toml` را با ID دیتابیس خودت عوض کن.
3. اجرا:

```bash
npm install
npx wrangler d1 migrations apply bipelak-automation --remote
npx wrangler deploy
```

4. بعد از migration، یک ادمین بساز. برای تولید SHA-256 رمز، در Console مرورگر:

```js
await crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PASSWORD')).then(b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''))
```

خروجی را جای `HASH` در `seed-admin.sql` بگذار و:

```bash
npx wrangler d1 execute bipelak-automation --remote --file=seed-admin.sql
```

## تست محلی
```bash
npx wrangler dev
```

## نکته
`node_modules` عمداً داخل ZIP نیست. وابستگی‌ها با `npm install` نصب می‌شوند.
