import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus } from "lucide-react";

export default function Tickets(){
  const [items,setItems]=useState([]),[open,setOpen]=useState(false),[form,setForm]=useState({type:"Leave",title:"",description:"",priority:"Medium",leave_type:"Annual",start_date:"",end_date:"",item_name:"",estimated_cost:""}),[error,setError]=useState("");
  async function load(){try{setItems((await api("/tickets")).tickets)}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  async function submit(e){e.preventDefault();setError("");try{await api("/tickets",{method:"POST",body:JSON.stringify(form)});setOpen(false);load()}catch(e){setError(e.message)}}
  return <section><div className="page-head"><div><small>مرخصی، خرید و درخواست داخلی</small><h1>تیکت‌ها</h1></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={18}/> درخواست جدید</button></div>
    {error&&<div className="error">{error}</div>}
    <div className="cards-list">{items.map(x=><article className="list-card" key={x.id}><div><b>{x.ticket_number} — {x.title}</b><p>{x.description||"بدون توضیح"}</p></div><div><span className="badge">{x.type}</span><span className="badge">{x.status}</span><small>{x.requester_name}</small></div></article>)}</div>
    {open&&<div className="modal"><form className="modal-card" onSubmit={submit}><div className="modal-head"><h2>درخواست جدید</h2><button type="button" onClick={()=>setOpen(false)}>×</button></div>
      <label>نوع درخواست<select value={form.type} onChange={e=>set("type",e.target.value)}><option value="Leave">مرخصی</option><option value="Purchase">خرید</option><option value="Equipment">تجهیزات</option><option value="Technical">فنی</option><option value="HR">منابع انسانی</option><option value="General">عمومی</option></select></label>
      <label>عنوان<input value={form.title} onChange={e=>set("title",e.target.value)} required/></label>
      {form.type==="Leave"&&<div className="form-grid"><label>از<input type="date" value={form.start_date} onChange={e=>set("start_date",e.target.value)} required/></label><label>تا<input type="date" value={form.end_date} onChange={e=>set("end_date",e.target.value)} required/></label></div>}
      {form.type==="Purchase"&&<div className="form-grid"><label>کالا<input value={form.item_name} onChange={e=>set("item_name",e.target.value)}/></label><label>هزینه تخمینی<input type="number" value={form.estimated_cost} onChange={e=>set("estimated_cost",e.target.value)}/></label></div>}
      <label>توضیحات<textarea value={form.description} onChange={e=>set("description",e.target.value)}/></label>
      <button className="primary">ثبت درخواست</button>
    </form></div>}
  </section>
}
