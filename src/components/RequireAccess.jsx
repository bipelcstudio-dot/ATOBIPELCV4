import { useAuth } from "../context/AuthContext";

export default function RequireAccess({ access, children }) {
  const { user } = useAuth();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions
    : (() => {
        try {
          const value = JSON.parse(user?.permissions || "[]");
          return Array.isArray(value) ? value : Object.keys(value).filter(key => value[key]);
        } catch {
          return [];
        }
      })();
  const aliases = access === "projects" ? ["projects", "tasks", "meetings", "freelancers"] : [access];
  const allowed = aliases.some(key =>
    user?.access?.[key] ||
    permissions.includes(key) ||
    permissions.includes(key + ".view") ||
    permissions.includes(key + ".all")
  );
  if (!allowed) {
    return <div className="empty" style={{ flexDirection: "column", gap: 10 }}>
      <b>دسترسی به این بخش را ندارید.</b>
      <span style={{ color: "#8b8173", fontSize: 14 }}>اگر فکر می‌کنید این یک اشتباه است، با مدیر سیستم صحبت کنید.</span>
    </div>;
  }
  return children;
}
