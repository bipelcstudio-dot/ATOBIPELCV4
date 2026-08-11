import { useEffect, useState } from "react";
import { api } from "../api";

const cards = [
  ["monthlyRevenue","درآمد این ماه"," تومان"],
  ["activeProjects","پروژه‌های فعال",""],
  ["overdueTasks","تسک‌های عقب‌افتاده",""],
  ["pendingRequests","درخواست‌های باز",""],
  ["newClients","مشتری‌های جدید",""],
  ["monthlyExpenses","هزینه این ماه"," تومان"],
  ["customerDebt","بدهی مشتریان"," تومان"],
  ["netProfit","سود خالص"," تومان"]
];

export default function Dashboard() {
  const [s,setS]=useState(null);
  useEffect(()=>{api("/dashboard/stats").then(d=>setS(d.stats));},[]);
  return <section><div className="page-head"><div><small>BIPELC OS</small><h1>داشبورد مدیریت</h1></div></div>
    <div className="grid stats">{cards.map(([k,l,u])=><div className="stat" key={k}><span>{l}</span><strong>{s?Number(s[k]||0).toLocaleString("fa-IR"):"—"}{u}</strong></div>)}</div>
  </section>;
}
