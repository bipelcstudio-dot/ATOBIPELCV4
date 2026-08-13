این بسته بر اساس نسخه فعلی ریپو ساخته شده و فرم‌های اصلی CRUD را با Schema اولیه D1 هماهنگ می‌کند.

فایل‌ها:
src/pages/Employees.jsx
src/pages/Clients.jsx
src/pages/Projects.jsx
src/pages/Tasks.jsx
src/pages/Freelancers.jsx
src/pages/Finance.jsx
src/App.jsx

اصلاحات اصلی:
- مقادیر role فقط مقادیر قابل قبول Schema هستند.
- status و type به مقادیر دیتابیس ارسال می‌شوند.
- فیلدهای NOT NULL قبل از ارسال اعتبارسنجی می‌شوند.
- مقدارهای خالی اختیاری null می‌شوند.
- permissions برای کاربر جدید [] می‌شود.
- username تکراری در فرم کارمند بررسی می‌شود.
- مسیرهای Clients / Tasks / Freelancers به App اضافه شده‌اند.

بعد از جایگزینی:
npm install
npm run build
npx wrangler deploy

D1 را Reset نکنید و migration قدیمی را دوباره اجرا نکنید.
