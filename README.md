# Bipelak Studio Automation - Complete Audit & Rebuild Package

این بسته شامل اصلاحات کامل دیتابیس Cloudflare D1، انتهای Backend (Cloudflare Worker API) و فرانت‌اند برای سیستم اتوماسیون آژانس خلاق بی‌پلک است.

## ساختار فایل‌ها:
- `migrations/0001_init.sql`: مایگریشون دیتابیس D1 همراه با انوم‌ها و کلیدهای خارجی.
- `src/index.js`: موتور سرور کلاودفلر ورکرز شامل سیستم کنترل دسترسی، محاسبات داشبورد واقعی و اعتبارسنجی API.
- `src/components/EmployeeFormModal.jsx`: فرم افزودن همکار/کارمند با انتخاب سطوح دسترسی و نقش‌های استاندارد.

## دستورات اجرا و انتشار:
1. اجرای مایگریشون دیتابیس:
   `npx wrangler d1 migrations apply bipelak-db --remote`
2. بیلد پروژه فرانت‌اند:
   `npm run build`
3. انتشار سیستم:
   `npx wrangler deploy`
