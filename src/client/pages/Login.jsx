import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Search, UserRound, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function Login() {
  const { user, selectEmployee } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/users");
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message || "فهرست کارکنان دریافت نشد.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.full_name, u.position, u.job_title, u.department, u.role, u.username]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, query]);

  if (user) return <Navigate to="/dashboard" replace />;

  async function enter(u) {
    setBusy(u.id);
    setError("");
    try {
      await selectEmployee(u.id);
    } catch (e) {
      setError(e.message || "ورود انجام نشد.");
      setBusy("");
    }
  }

  return (
    <div className="employee-login-page">
      <div className="employee-login-glow glow-one" />
      <div className="employee-login-glow glow-two" />

      <main className="employee-login-shell">
        <header className="employee-login-header">
          <div className="brand big">BIPELC<span>OS</span></div>
          <div className="employee-login-title">
            <span className="eyebrow"><ShieldCheck size={15} /> فضای داخلی بی‌پلک</span>
            <h1>خوش اومدی 👋</h1>
            <p>برای ورود، پروفایل خودت رو انتخاب کن.</p>
          </div>
        </header>

        <div className="employee-login-toolbar">
          <div className="employee-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام، سمت یا واحد..."
            />
          </div>
          <button className="selector-refresh" onClick={loadUsers} disabled={loading} title="به‌روزرسانی">
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="employee-selector-state">در حال دریافت کارکنان...</div>
        ) : filtered.length === 0 ? (
          <div className="employee-selector-state">
            <UserRound size={34} />
            <b>کارمندی پیدا نشد</b>
            <span>اول از داخل بخش «کارمندان» یک کارمند ثبت کن.</span>
          </div>
        ) : (
          <section className="employee-grid">
            {filtered.map((u) => (
              <button
                key={u.id}
                className="employee-card"
                onClick={() => enter(u)}
                disabled={!!busy}
              >
                <div className="employee-avatar">
                  {(u.full_name || u.username || "?").trim().charAt(0)}
                </div>
                <div className="employee-card-body">
                  <strong>{u.full_name || u.username}</strong>
                  <span>{u.position || u.job_title || u.role || "عضو تیم"}</span>
                  {u.department && <small>{u.department}</small>}
                </div>
                <span className="employee-card-arrow">
                  {busy === u.id ? "..." : <ArrowLeft size={19} />}
                </span>
              </button>
            ))}
          </section>
        )}

        <footer className="employee-login-footer">
          <span>{users.length} پروفایل فعال</span>
          <span>BIPELC Studio • Internal OS</span>
        </footer>
      </main>
    </div>
  );
}
