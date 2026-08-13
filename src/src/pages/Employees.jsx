import { useEffect, useState } from "react";
import { api } from "../api";

const roles=[["Super Admin","سوپر ادمین"],["Admin","مدیر"],["Manager","مدیر اجرایی"],["Employee","کارمند"],["Freelancer","فریلنسر"]];
const empty={full_name:"",username:"",password:"",position:"",department:"",role:"Employee",status:"Active"};
export default function Employees(){
 const [items,setItems]=useState([]),[open,setOpen]=useState(false),[form,setForm]=useState(empty),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const load=async()=>{try{const d=await api("/users");setItems(d.items||d.users||[])}catch(e){setError(e.message)}};
 useEffect(()=>{load()},[]);
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 async function submit(e){e.preventDefault();setError("");
  if(!form.full_name.trim())return setError("نام و نام خانوادگی الزامی است.");
  if(!form.username.trim())return setError("نام کاربری الزامی است.");
  if(form.password.length<6)return setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
  if(items.some(x=>String(x.username||"").toLowerCase()===form.username.trim().toLowerCase()))return setError("این نام کاربری قبلاً استفاده شده است.");
  setBusy(true);try{await api("/users",{method:"POST",body:JSON.stringify({username:form.username.trim(),password:form.password,full_name:form.full_name.trim(),position:form.position.trim()||null,job_title:form.position.trim()||null,department:form.department.trim()||null,role:form.role,status:form.status,permissions:[]})});setOpen(false);setForm(empty);await load()}catch(e){setError(e.message)}finally{setBusy(false)}
 }
 return <section><div className="page-head"><div><small>منابع انسانی</small><h1>کارمندان</h1></div><button className="primary" onClick={()=>{setError("");setOpen(true)}}>+ کارمند جدید</button></div>
 {error&&<div className="error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>نام</th><th>نام کاربری</th><th>نقش</th><th>سمت</th><th>واحد</th><th>وضعیت</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.full_name||"—"}</td><td>{x.username}</td><td>{x.role}</td><td>{x.position||x.job_title||"—"}</td><td>{x.department||"—"}</td><td>{x.status||"Active"}</td></tr>)}{!items.length&&<tr><td colSpan="6">اطلاعاتی ثبت نشده است.</td></tr>}</tbody></table></div>
 {open&&<div className="modal"><form className="modal-card" onSubmit={submit}><div className="modal-head"><h2>افزودن کارمند</h2><button type="button" onClick={()=>setOpen(false)}>×</button></div>
 <label>نام و نام خانوادگی<input required value={form.full_name} onChange={e=>set("full_name",e.target.value)}/></label>
 <div className="form-grid"><label>نام کاربری<input required value={form.username} onChange={e=>set("username",e.target.value)}/></label><label>رمز عبور<input required minLength="6" type="password" value={form.password} onChange={e=>set("password",e.target.value)}/></label>
 <label>سمت سازمانی<input value={form.position} onChange={e=>set("position",e.target.value)}/></label><label>واحد<input value={form.department} onChange={e=>set("department",e.target.value)}/></label>
 <label>نقش سیستمی<select value={form.role} onChange={e=>set("role",e.target.value)}>{roles.map(x=><option value={x[0]} key={x[0]}>{x[1]}</option>)}</select></label>
 <label>وضعیت<select value={form.status} onChange={e=>set("status",e.target.value)}><option value="Active">فعال</option><option value="Inactive">غیرفعال</option></select></label></div>
 <button className="primary" disabled={busy}>{busy?"در حال ثبت...":"ثبت کارمند"}</button></form></div>}</section>
}