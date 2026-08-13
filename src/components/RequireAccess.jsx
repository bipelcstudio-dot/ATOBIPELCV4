import { useAuth } from "../context/AuthContext";

// جلوگیری از این حالت که کاربر یک تب رو تو منو می‌بینه (یا مستقیم URL رو باز می‌کنه)
// ولی چون دسترسی نداره فقط یک پیام خطای خام از API می‌گیره.
export default function RequireAccess({ access, children }) {
  const { user } = useAuth();
  if (!user?.access?.[access]) {
    return (
      <div className="empty" style={{ flexDirection: "column", gap: 10 }}>
        <b>دسترسی به این بخش را ندارید.</b>
        <span style={{ color: "#8b8173", fontSize: 14 }}>
          اگر فکر می‌کنید این یک اشتباه است، با مدیر سیستم صحبت کنید.
        </span>
      </div>
    );
  }
  return children;
}
