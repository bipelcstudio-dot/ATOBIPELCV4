import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, UserRound } from "lucide-react";

const roles=["Super Admin","Operations Manager","Sales Manager","Project Manager","Employee","Freelancer","Client"];

export default function Employees(){
  const [users,setUsers]=useState([]),[open,setOpen]=useState(false),[error,setError]=useState("");
  const [form,setForm]=useState({first_name:"",last_name:"",username:"",password:"",role:"Employee",department:"",job_title:"",email:"",phone:""});
  async function load(){try{setUsers((await api("/users")).users)}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[]);
  function set(k,v){setForm(f=>({...f,[k]:v}))}
  async function submit(e){e.preventDefault();setError("");try{await api("/users",{method:"POST",body:JSON.stringify(form)});setOpen(false);setForm({first_name:"",last_name:"",username:"",password:"",role:"Employee",department:"",job_title:"",email:"",phone:""});load()}catch(e){setError(e.message)}}
  return <section><div className="page-head"><div><small>مدیریت منابع انسانی</small><h1>کارمندان</h1></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={18}/> کارمند جدید</button></div>
    {error&&<div className="error">{error}</div>}
    <div className="table-wrap"><table><thead><tr><th>نام</th><th>نقش</th><th>دپارتمان</th><th>سمت</th><th>وضعیت</th><th>کد</th></tr></thead><tbody>
      {users.map(u=><tr key={u.id}><td><b>{u.full_name}</b><small>{u.username}</small></td><td>{u.role}</td><td>{u.department||"—"}</td><td>{u.job_title||"—"}</td><td><span className="badge">{u.status}</span></td><td>{u.employee_code||"—"}</td></tr>)}
    </tbody></table></div>
    {open&&<div className="modal"><form className="modal-card" onSubmit={submit}><div className="modal-head"><h2>افزودن کارمند</h2><button type="button" onClick={()=>setOpen(false)}>×</button></div>
      <div className="form-grid">{[["first_name","نام"],["last_name","نام خانوادگی"],["username","نام کاربری"],["password","رمز عبور"],["email","ایمیل"],["phone","موبایل"],["department","دپارتمان"],["job_title","سمت"]].map(([k,l])=><label key={k}>{l}<input type={k==="password"?"password":"text"} value={form[k]} onChange={e=>set(k,e.target.value)} required={["first_name","last_name","username","password"].includes(k)}/></label>)}
      <label>نقش<select value={form.role} onChange={e=>set("role",e.target.value)}>{roles.map(r=><option key={r}>{r}</option>)}</select></label></div>
      {error&&<div className="error">{error}</div>}<button className="primary" type="submit">ساخت حساب</button>
    </form></div>}
  </section>
}
