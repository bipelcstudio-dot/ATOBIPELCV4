import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist" },
  server: {
    proxy: {
      // در حالت توسعه (npm run dev)، Vite فقط فرانت‌اند رو سرو می‌کنه.
      // بدون این proxy، درخواست‌های /api به‌جای Worker به خود Vite می‌خورن
      // و چون SPA fallback فعاله، بجای خطا یک صفحه‌ی HTML برمی‌گرده که
      // باعث میشه فرم لاگین/راه‌اندازی بدون هیچ خطایی «کار نکنه».
      // اجرا کنید: `npx wrangler dev` در یک ترمینال جدا (پورت پیش‌فرض 8787)
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true
      }
    }
  }
});
