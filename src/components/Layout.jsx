import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Ticket, MessageCircle, Wallet, FolderKanban, LogOut, CalendarDays, UserRound, CheckSquare, BriefcaseBusiness } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// کلید چهارم همون نامی هست که بک‌اند برای access استفاده می‌کنه (index.js -> ROLE_PERMISSIONS)
const ALL_LINKS = [
  ["/dashboard", "داشبورد", LayoutDashboard, "dashboard"],
  ["/employees", "کارمندان", Users, "employees"],
  ["/clients", "مشتریان", UserRound, "clients"],
  ["/projects", "پروژه‌ها", FolderKanban, "projects"],
  ["/tasks", "تسک‌ها", CheckSquare, "projects"],
  ["/meetings", "جلسات", CalendarDays, "projects"],
  ["/freelancers", "فریلنسرها", BriefcaseBusiness, "projects"],
  ["/tickets", "درخواست‌ها و تیکت‌ها", Ticket, "tickets"],
  ["/chat", "چت سازمانی", MessageCircle, "chat"],
  ["/finance", "مالی", Wallet, "finance"],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const links = ALL_LINKS.filter(([, , , key]) => user?.access?.[key] || (Array.isArray(user?.permissions) && (user.permissions.includes(key) || user.permissions.includes(key + ".view") || user.permissions.includes(key + ".all"))));

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">BIPELC<span>OS</span></div>
      <div className="user-mini"><b>{user?.full_name}</b><small>{user?.role}</small></div>
      <nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}><Icon size={18} />{label}</NavLink>)}</nav>
      <button className="logout" onClick={logout}><LogOut size={18} /> خروج</button>
    </aside>
    <main className="main"><Outlet /></main>
  </div>;
}
