import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const CARDS = [
  { key: "monthlyRevenue", label: "درآمد این ماه", unit: " تومان", finance: true },
  { key: "activeProjects", label: "پروژه‌های فعال", unit: "", finance: false },
  { key: "overdueTasks", label: "تسک‌های عقب‌افتاده", unit: "", finance: false },
  { key: "pendingRequests", label: "درخواست‌های باز", unit: "", finance: false },
  { key: "newClients", label: "مشتری‌های جدید", unit: "", finance: false },
  { key: "monthlyExpenses", label: "هزینه این ماه", unit: " تومان", finance: true },
  { key: "customerDebt", label: "بدهی مشتریان", unit: " تومان", finance: true },
  { key: "netProfit", label: "سود خالص", unit: " تومان", finance: true },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [s, setS] = useState(null);
  useEffect(() => { api("/dashboard/stats").then(d => setS(d.stats)); }, []);

  const cards = CARDS.filter(c => !c.finance || user?.access?.finance);

  return <section><div className="page-head"><div><small>BIPELC OS</small><h1>داشبورد مدیریت</h1></div></div>
    <div className="grid stats">{cards.map(({ key, label, unit }) => <div className="stat" key={key}><span>{label}</span><strong>{s ? Number(s[key] || 0).toLocaleString("fa-IR") : "—"}{unit}</strong></div>)}</div>
  </section>;
}
