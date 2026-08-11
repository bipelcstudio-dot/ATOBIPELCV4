import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try { await login(username,password); } catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="login-page"><form className="login-card" onSubmit={submit}>
    <div className="brand big">BIPELC<span>OS</span></div>
    <h1>ورود به سیستم</h1><p>اتوماسیون داخلی استودیو بی‌پلک</p>
    {error && <div className="error">{error}</div>}
    <label>نام کاربری<input value={username} onChange={e=>setUsername(e.target.value)} required /></label>
    <label>رمز عبور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
    <button className="primary" disabled={busy}>{busy?"در حال ورود...":"ورود"}</button>
  </form></div>;
}
