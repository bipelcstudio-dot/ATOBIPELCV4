import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login, setupAdmin } = useAuth();

  const [mode, setMode] = useState("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function submitLogin(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setBusy(true);

    try {
      await login(username, password);
    } catch (e) {
      setError(e.message || "ورود انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function submitSetup(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (setupPassword.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }

    if (setupPassword !== setupPasswordConfirm) {
      setError("تکرار رمز عبور با رمز اصلی یکسان نیست.");
      return;
    }

    setBusy(true);

    try {
      await setupAdmin({
        username: setupUsername,
        password: setupPassword,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
      });

      setSuccess(
        "Super Admin با موفقیت ساخته شد. حالا با اطلاعاتی که ساختید وارد شوید."
      );

      setUsername(setupUsername);
      setPassword("");
      setMode("login");
    } catch (e) {
      setError(e.message || "راه‌اندازی سیستم انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="brand big">
          BIPELC<span>OS</span>
        </div>

        {mode === "login" ? (
          <>
            <h1>ورود به سیستم</h1>
            <p>اتوماسیون داخلی استودیو بی‌پلک</p>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <form onSubmit={submitLogin}>
              <label>
                نام کاربری
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                رمز عبور
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              <button className="primary" disabled={busy}>
                {busy ? "در حال ورود..." : "ورود"}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setMode("setup");
                  setError("");
                  setSuccess("");
                }}
              >
                راه‌اندازی اولیه سیستم
              </button>
            </div>
          </>
        ) : (
          <>
            <h1>راه‌اندازی اولیه</h1>
            <p>ساخت اولین حساب Super Admin</p>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <form onSubmit={submitSetup}>

              <label>
                نام
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </label>

              <label>
                نام خانوادگی
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </label>

              <label>
                ایمیل
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>

              <label>
                نام کاربری Super Admin
                <input
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                رمز عبور
                <input
                  type="password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label>
                تکرار رمز عبور
                <input
                  type="password"
                  value={setupPasswordConfirm}
                  onChange={(e) =>
                    setSetupPasswordConfirm(e.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <button className="primary" disabled={busy}>
                {busy
                  ? "در حال ساخت حساب..."
                  : "ساخت Super Admin"}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccess("");
                }}
              >
                بازگشت به ورود
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}