import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Ticket, MessageCircle, Wallet, FolderKanban, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  ["/dashboard","داشبورد",LayoutDashboard],
  ["/employees","کارمندان",Users],
  ["/projects","پروژه‌ها",FolderKanban],
  ["/tickets","درخواست‌ها و تیکت‌ها",Ticket],
  ["/chat","چت سازمانی",MessageCircle],
  ["/finance","مالی",Wallet]
];

export default function Layout() {
  const { user, logout } = useAuth();
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">BIPELC<span>OS</span></div>
      <div className="user-mini"><b>{user?.full_name}</b><small>{user?.role}</small></div>
      <nav>{links.map(([to,label,Icon]) => <NavLink key={to} to={to} className={({isActive})=>isActive?"active":""}><Icon size={18}/>{label}</NavLink>)}</nav>
      <button className="logout" onClick={logout}><LogOut size={18}/> خروج</button>
    </aside>
    <main className="main"><Outlet /></main>
  </div>;
}
