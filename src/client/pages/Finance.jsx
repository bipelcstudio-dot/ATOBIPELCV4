import { useEffect, useState } from "react";
import { api } from "../api";

export default function Finance(){
  const [items,setItems]=useState([]),[open,setOpen]=useState(false),[form,setForm]=useState({type:"Income",category:"",amount:"",date:new Date().toISOString().slice(0,10),description:""}),[error,setError]=useState("");
  async function load(){try{setItems((await api("/finance")).items)}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  async function submit(e){e.preventDefault();try{await api("/finance",{method:"POST",body:JSON.stringify(form)});setOpen(false);load()}catch(e){setError(e.message)}}
  return <section><div className="page-head"><div><small>حسابداری داخلی</small><h1>مالی</h1></div><button className="primary" onClick={()=>setOpen(true)}>ثبت تراکنش</button></div>
    {error&&<div className="error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>نوع</th><th>دسته</th><th>مبلغ</th><th>تاریخ</th><th>توضیح</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.type}</td><td>{x.category}</td><td>{Number(x.amount).toLocaleString("fa-IR")}</td><td>{x.date}</td><td>{x.description||"—"}</td></tr>)}</tbody></table></div>
    {open&&<div className="modal"><form className="modal-card" onSubmit={submit}><div className="modal-head"><h2>ثبت تراکنش</h2><button type="button" onClick={()=>setOpen(false)}>×</button></div><label>نوع<select value={form.type} onChange={e=>set("type",e.target.value)}><option>Income</option><option>Expense</option></select></label><label>دسته<input value={form.category} onChange={e=>set("category",e.target.value)} required/></label><label>مبلغ<input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} required/></label><label>تاریخ<input type="date" value={form.date} onChange={e=>set("date",e.target.value)} required/></label><label>توضیح<textarea value={form.description} onChange={e=>set("description",e.target.value)}/></label><button className="primary">ثبت</button></form></div>}
  </section>
}
