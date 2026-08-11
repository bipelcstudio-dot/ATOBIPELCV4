import { useEffect, useState } from "react";
import { api } from "../api";

export default function Projects(){
  const [items,setItems]=useState([]),[open,setOpen]=useState(false),[form,setForm]=useState({title:"",description:"",budget:"",deadline:"",priority:"Medium"}),[error,setError]=useState("");
  async function load(){try{setItems((await api("/projects")).projects)}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  async function submit(e){e.preventDefault();try{await api("/projects",{method:"POST",body:JSON.stringify(form)});setOpen(false);load()}catch(e){setError(e.message)}}
  return <section><div className="page-head"><div><small>مدیریت تولید</small><h1>پروژه‌ها</h1></div><button className="primary" onClick={()=>setOpen(true)}>پروژه جدید</button></div>
    {error&&<div className="error">{error}</div>}<div className="cards-list">{items.map(x=><article className="list-card" key={x.id}><div><b>{x.title}</b><p>{x.description||"بدون توضیح"}</p></div><div><span className="badge">{x.status}</span><span className="badge">{x.priority}</span><strong>{Number(x.progress||0)}%</strong></div></article>)}</div>
    {open&&<div className="modal"><form className="modal-card" onSubmit={submit}><div className="modal-head"><h2>پروژه جدید</h2><button type="button" onClick={()=>setOpen(false)}>×</button></div><label>عنوان<input value={form.title} onChange={e=>set("title",e.target.value)} required/></label><label>توضیحات<textarea value={form.description} onChange={e=>set("description",e.target.value)}/></label><div className="form-grid"><label>بودجه<input type="number" value={form.budget} onChange={e=>set("budget",e.target.value)}/></label><label>ددلاین<input type="date" value={form.deadline} onChange={e=>set("deadline",e.target.value)}/></label></div><button className="primary">ساخت پروژه</button></form></div>}
  </section>
}
