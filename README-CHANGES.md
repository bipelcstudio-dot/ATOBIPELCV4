# تغییرات این تحویل — BIPELC OS

## چیزهایی که برام آپلود نشده بود (پس دست‌نخورده باقی موندن یا بازسازی شدن)
- `dist/`, `node_modules/` — لازم نبود، خودت با `npm install` می‌سازیشون.
- `index.html`, `vite.config.js`, `README-DEPLOY.md` — چون برام فرستاده نشدن، تغییری روشون ندادم؛ همونایی که خودت داری رو نگه دار.
- `wrangler.toml` و `schema.sql` — این‌ها رو **بازسازی کردم** چون نسخه‌ی اصلی‌شون رو نداشتم (فقط از روی کوئری‌های SQL داخل `index.js` حدس زدم). قبل از اجرا حتماً با نسخه‌ی واقعی خودت مقایسه/merge کن، مخصوصاً `database_id` و `account_id` داخل `wrangler.toml`.

## 🔴 باگ امنیتی حیاتی که درست شد
`GET /api/auth/users` و `POST /api/auth/select` قبلاً کاملاً بدون احراز هویت بودن —
یعنی هرکسی روی اینترنت می‌تونست کل لیست کارکنان (با `id`شون) رو ببینه و با همون
`id`، بدون هیچ رمزی، به‌جای هر کارمندی از جمله **Super Admin** لاگین کنه.

**راه‌حل:** یک لایه‌ی "کد ورود سازمانی" (`WORKSPACE_PIN`) اضافه شد. قبل از دیدن لیست
کارکنان، باید این PIN یک‌بار در مرورگر وارد بشه (کوکی ۱۲ ساعته). بعدش همون تجربه‌ی
سریع «روی اسمت بزن، وارد شو» مثل قبل کار می‌کنه — ولی دیگه از بیرون قابل‌دسترس نیست.

**کاری که باید دستی انجام بدی، وگرنه گیت وصل نمی‌شه:**
```
wrangler secret put WORKSPACE_PIN
```
یک کد چندرقمی/کلمه‌ی ساده انتخاب کن و فقط به کارکنانت بگو (مثلاً از طریق پیام داخلی/دستی).

## 🟠 selector-worker.js حذف شد
این فایل یک کپی موازی و قدیمی‌تر از همون دو روت بالا بود که:
- باگ داشت: `WHERE status != 'Inactive'` بدون `COALESCE` — کارمندهایی که `status`شون
  `NULL` بود از لیست انتخاب پروفایل ناپدید می‌شدن (رفتار NULL در SQLite).
- ستون‌های `department` / `job_title` رو select نمی‌کرد در حالی که `Login.jsx` روشون
  جستجو و نمایش می‌زد.
- کوکی رو با `Secure: true` هاردکد ست می‌کرد؛ روی `wrangler dev` (http محلی) این باعث
  می‌شد کاربر لاگین "موفق" بشه ولی سشن اصلاً ذخیره نشه و با رفرش صفحه پرت بشه بیرون.

همه‌ی این‌ها الان فقط یک‌بار، درست، داخل `src/index.js` پیاده‌سازی شدن.

**کاری که باید دستی انجام بدی:** `wrangler.toml` رو چک کن که `main` مستقیم به
`src/index.js` اشاره کنه (نه `selector-worker.js`).

## 🟡 سیستم Permission واقعی اضافه شد
داخل `src/index.js` یک `ROLE_PERMISSIONS` تعریف شده که هر نقش رو به مجموعه‌ای از
دسترسی‌ها (`dashboard`, `finance`, `employees`, `projects`, `manage_projects`,
`tickets`, `manage_tickets`, `chat`) نگاشت می‌کنه. ستون `users.permissions` (که قبلاً
تعریف شده بود ولی هیچ‌جا استفاده نمی‌شد) الان به‌عنوان override شخصی هر کارمند روی
این پیش‌فرض‌ها عمل می‌کنه — دقیقاً همون مدل Role + Permission + Override که خواسته
بودی. مثال مقدار این ستون برای یک کارمند خاص:
```json
{ "finance": true }
```
این هم دسترسی مالی رو به یک Employee عادی می‌ده، بدون تغییر نقشش.

نتیجه:
- API دیگه فقط با یک آرایه‌ی هاردکد نقش چک نمی‌شه، بلکه از `access` واقعی استفاده می‌کنه.
- `/api/dashboard/stats` ارقام مالی (درآمد، سود، بدهی) رو فقط به کسایی که `finance`
  دسترسی دارن برمی‌گردونه.
- منوی سایدبار (`Layout.jsx`) و صفحات محافظت‌شده (`RequireAccess.jsx`) الان دقیقاً
  همون آیتم‌هایی رو نشون می‌دن که کاربر واقعاً بهشون دسترسی داره — دیگه کارمند عادی
  تب «مالی» رو نمی‌بینه که بزنه و فقط پیام خطا بگیره.

## فایل‌های تمیزکاری‌شده
- `styles-passwordless.css` حذف شد چون محتواش از قبل عیناً داخل `styles.css` هم
  کپی شده بود (فایل مرده — هیچ‌جا import نمی‌شد).
- import بلااستفاده‌ی `UserRound` از `Employees.jsx` حذف شد.

## ساختار پوشه‌ی این تحویل
```
src/
  index.js              ← بک‌اند (Hono + D1) — تمام فیکس‌ها اینجاست
  api.js
  main.jsx
  App.jsx
  styles.css
  context/AuthContext.jsx
  components/Layout.jsx
  components/ProtectedRoute.jsx
  components/RequireAccess.jsx   ← جدید
  pages/Login.jsx        ← مرحله‌ی PIN اضافه شد
  pages/Dashboard.jsx    ← کارت‌های مالی فیلتر می‌شن
  pages/Employees.jsx
  pages/Finance.jsx
  pages/Projects.jsx
  pages/Tickets.jsx
  pages/Chat.jsx
package.json
wrangler.toml           ← بازسازی‌شده، مقادیر TODO رو پر کن
schema.sql               ← بازسازی‌شده، با schema واقعی‌ت merge کن
```

## چک‌لیست قبل از deploy
1. `wrangler secret put WORKSPACE_PIN`
2. `wrangler.toml` را با مقادیر واقعی (`database_id`, `account_id`, هر route دیگه) merge کن.
3. `schema.sql` را با نسخه‌ی واقعی مقایسه کن؛ اگه یکی بود مستقیم اجرا کن، اگه فرق داشت دستی merge کن.
4. مطمئن شو `selector-worker.js` از ریپو حذف شده و `main` در `wrangler.toml` به `src/index.js` اشاره می‌کنه.
5. `npm run build && wrangler deploy`
