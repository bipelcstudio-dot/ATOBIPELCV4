import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus } from "lucide-react";

const roles = ["Super Admin", "Operations Manager", "Sales Manager", "Project Manager", "Employee", "Freelancer", "Client"];
const emptyForm = { full_name: "", position: "", role: "Employee", department: "", status: "Active", username: "" };

export default function Employees() {
  const [users, setUsers] = useState([]), [open, setOpen] = useState(false), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try { const d = await api("/users"); setUsers(d.items || d.users || []); }
    catch (e) { setError(e.message || "خطا در دریافت کارکنان"); }
  }
  useEffect(() => { load(); }, []);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      await api("/users", { method: "POST", body: JSON.stringify(form) });
      setOpen(false); setForm(emptyForm); await load();
    } catch (e) { setError(e.message || "ثبت کارمند انجام نشد."); }
    finally { setBusy(false); }
  }

  return <section>
    <div className="page-head">
      <div><small>مدیریت منابع انسانی</small><h1>کارمندان</h1></div>
      <button className="primary" onClick={() => setOpen(true)}><Plus size={18} /> کارمند جدید</button>
    </div>
    {error && <div className="error">{error}</div>}
    <div className="table-wrap"><table><thead><tr><th>نام</th><th>نقش</th><th>واحد</th><th>سمت</th><th>وضعیت</th></tr></thead><tbody>
      {users.map(u => <tr key={u.id}>
        <td><b>{u.full_name || u.username}</b><small>{u.username || "—"}</small></td>
        <td>{u.role || "—"}</td><td>{u.department || "—"}</td><td>{u.position || u.job_title || "—"}</td>
        <td><span className="badge">{u.status || "Active"}</span></td>
      </tr>)}
      {!users.length && <tr><td colSpan="5">هنوز کارمندی ثبت نشده است.</td></tr>}
    </tbody></table></div>

    {open && <div className="modal"><form className="modal-card" onSubmit={submit}>
      <div className="modal-head"><h2>افزودن کارمند</h2><button type="button" onClick={() => setOpen(false)}>×</button></div>
      <p style={{ color: "#766e63", marginTop: -8 }}>نام کاربری اختیاری است؛ سیستم در صورت خالی بودن یک شناسه داخلی می‌سازد.</p>
      <div className="form-grid">
        <label>نام و نام خانوادگی<input value={form.full_name} onChange={e => set("full_name", e.target.value)} required placeholder="مثلاً محمد احمدی" /></label>
        <label>نام کاربری داخلی<input value={form.username} onChange={e => set("username", e.target.value)} placeholder="اختیاری" /></label>
        <label>سمت<input value={form.position} onChange={e => set("position", e.target.value)} placeholder="مثلاً تدوینگر" /></label>
        <label>واحد / دپارتمان<input value={form.department} onChange={e => set("department", e.target.value)} placeholder="مثلاً استودیو" /></label>
        <label>نقش<select value={form.role} onChange={e => set("role", e.target.value)}>{roles.map(r => <option key={r}>{r}</option>)}</select></label>
        <label>وضعیت<select value={form.status} onChange={e => set("status", e.target.value)}><option>Active</option><option>Inactive</option></select></label>
      </div>
      <button className="primary" type="submit" disabled={busy}>{busy ? "در حال ثبت..." : "ثبت کارمند"}</button>
    </form></div>}
  </section>;
}
