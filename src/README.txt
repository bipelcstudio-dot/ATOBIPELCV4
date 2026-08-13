فایل اصلاح‌شده Employees.jsx

اصلاحات:
1. Role دیگر Input آزاد نیست و فقط Dropdown است.
2. Role فقط مقادیر مجاز D1 را ارسال می‌کند:
   Super Admin
   Admin
   Manager
   Employee
   Freelancer

3. Status فقط Active / Inactive است.
4. سمت سازمانی از Role جدا شده است.
5. نام کاربری و رمز عبور اجباری شده‌اند.
6. Username تکراری قبل از POST کنترل می‌شود.
7. permissions به صورت آرایه JSON ارسال می‌شود.
8. برای کارمند جدید امکان انتخاب/حذف دسترسی‌های پنل اضافه شده:
   dashboard
   clients
   projects
   tasks
   finance
   contracts
   hr
   freelancers
   requests
   chat
   employees

نحوه استفاده:
فایل src/pages/Employees.jsx را در پروژه فعلی جایگزین کنید.

سپس:
npm install
npm run build
npx wrangler deploy

D1 را Reset نکنید.
