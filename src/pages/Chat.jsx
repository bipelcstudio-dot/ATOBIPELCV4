import { useEffect, useState } from "react";
import { api } from "../api";

export default function Chat(){
  const [convs,setConvs]=useState([]),[active,setActive]=useState(null),[messages,setMessages]=useState([]),[text,setText]=useState(""),[newOpen,setNewOpen]=useState(false),[title,setTitle]=useState("");
  async function load(){setConvs((await api("/conversations")).conversations)}
  useEffect(()=>{load()},[]);
  useEffect(()=>{if(active)api(`/conversations/${active}/messages`).then(d=>setMessages(d.messages))},[active]);
  async function send(e){e.preventDefault();if(!text.trim()||!active)return;await api(`/conversations/${active}/messages`,{method:"POST",body:JSON.stringify({message:text})});setText("");setMessages((await api(`/conversations/${active}/messages`)).messages)}
  async function create(){if(!title.trim())return;const d=await api("/conversations",{method:"POST",body:JSON.stringify({title,type:"group",user_ids:[]})});setTitle("");setNewOpen(false);await load();setActive(d.id)}
  return <section><div className="page-head"><div><small>ارتباط داخلی تیم</small><h1>چت سازمانی</h1></div><button className="primary" onClick={()=>setNewOpen(true)}>گفتگوی جدید</button></div>
    <div className="chat"><aside>{convs.map(c=><button key={c.id} className={active===c.id?"selected":""} onClick={()=>setActive(c.id)}><b>{c.title||"گفتگو"}</b><small>{c.last_message||"هنوز پیامی نیست"}</small></button>)}</aside>
      <div className="chat-main">{active?<><div className="messages">{messages.map(m=><div className="message" key={m.id}><b>{m.sender_name}</b><p>{m.message}</p><small>{new Date(m.created_at).toLocaleString("fa-IR")}</small></div>)}</div><form className="chat-input" onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} placeholder="پیام بنویس..." /><button className="primary">ارسال</button></form></>:<div className="empty">یک گفتگو را انتخاب کن.</div>}</div>
    </div>
    {newOpen&&<div className="modal"><div className="modal-card"><div className="modal-head"><h2>گفتگوی جدید</h2><button onClick={()=>setNewOpen(false)}>×</button></div><label>نام گفتگو<input value={title} onChange={e=>setTitle(e.target.value)}/></label><button className="primary" onClick={create}>ساخت گفتگو</button></div></div>}
  </section>
}
