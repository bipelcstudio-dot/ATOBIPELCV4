import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus } from "lucide-react";

const roles = [
  ["Super Admin", "سوپر ادمین"],
  ["Admin", "مدیر"],
  ["Manager", "مدیر اجرایی"],
  ["Employee", "کارمند"],
  ["Freelancer", "فریلنسر"],
];

const permissions = [
  ["dashboard", "داشبورد"],
  ["clients", "مشتریان"],
  ["projects", "پروژه‌ها"],
  ["tasks", "تسک‌ها"],
  ["finance", "مالی"],
  ["contracts", "قراردادها"],
  ["hr", "منابع انسانی"],
  ["freelancers", "فریلنسرها"],
  ["requests", "درخواست‌ها"],
  ["chat", "ارتباط داخلی تیم"],
  ["employees", "مدیریت کارکنان"],
];

const emptyForm = {
  full_name: "",
  position: "",
  department: "",
  role: "Employee",
  status: "Active",
  username: "",
  password: "",
  permissions: ["dashboard"],
};

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try {
      const d = await api("/users");
      setUsers(d.users || d.items || []);
    } catch (e) {
      setError(e.message || "خطا در دریافت کارکنان");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function togglePermission(key) {
    setForm((current) => {
      const exists = current.permissions.includes(key);

      return {
        ...current,
        permissions: exists
          ? current.permissions.filter((item) => item !== key)
          : [...current.permissions, key],
      };
    });
  }

  function selectAllPermissions() {
    setForm((current) => ({
      ...current,
      permissions: permissions.map(([key]) => key),
    }));
  }

  function clearPermissions() {
    setForm((current) => ({
      ...current,
      permissions: [],
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    const fullName = form.full_name.trim();
    const username = form.username.trim();

    if (!fullName) {
      setError("نام و نام خانوادگی الزامی است.");
      return;
    }

    if (!username) {
      setError("نام کاربری الزامی است.");
      return;
    }

    if (!form.password || form.password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    const duplicate = users.some(
      (user) =>
        String(user.username || "").toLowerCase() === username.toLowerCase()
    );

    if (duplicate) {
      setError("این نام کاربری قبلاً استفاده شده است.");
      return;
    }

    setBusy(true);

    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify({
          username,
          password: form.password,
          full_name: fullName,
          position: form.position.trim() || null,
          job_title: form.position.trim() || null,
          department: form.department.trim() || null,

          // فقط مقادیر مجاز CHECK constraint دیتابیس
          role: form.role,

          // فقط مقادیر استاندارد وضعیت
          status: form.status,

          // همیشه آرایه معتبر برای ستون NOT NULL permissions
          permissions: form.permissions,
        }),
      });

      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e.message || "ثبت کارمند انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <small>مدیریت منابع انسانی</small>
          <h1>کارمندان</h1>
        </div>

        <button
          className="primary"
          onClick={() => {
            setError("");
            setForm(emptyForm);
            setOpen(true);
          }}
        >
          <Plus size={18} />
          کارمند جدید
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>نام</th>
              <th>نام کاربری</th>
              <th>نقش</th>
              <th>واحد</th>
              <th>سمت</th>
              <th>وضعیت</th>
              <th>دسترسی‌ها</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              let userPermissions = [];

              try {
                userPermissions =
                  typeof user.permissions === "string"
                    ? JSON.parse(user.permissions || "[]")
                    : user.permissions || [];
              } catch {
                userPermissions = [];
              }

              return (
                <tr key={user.id}>
                  <td>
                    <b>{user.full_name || user.username}</b>
                  </td>
                  <td>{user.username || "—"}</td>
                  <td>{user.role || "—"}</td>
                  <td>{user.department || "—"}</td>
                  <td>{user.position || user.job_title || "—"}</td>
                  <td>
                    <span className="badge">{user.status || "Active"}</span>
                  </td>
                  <td>
                    {userPermissions.length
                      ? `${userPermissions.length} بخش`
                      : "بدون دسترسی"}
                  </td>
                </tr>
              );
            })}

            {!users.length && (
              <tr>
                <td colSpan="7">هنوز کارمندی ثبت نشده است.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal">
          <form className="modal-card" onSubmit={submit}>
            <div className="modal-head">
              <h2>افزودن کارمند</h2>
              <button type="button" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <div className="form-grid">
              <label>
                نام و نام خانوادگی
                <input
                  required
                  value={form.full_name}
                  onChange={(event) =>
                    setField("full_name", event.target.value)
                  }
                  placeholder="مثلاً محمد احمدی"
                />
              </label>

              <label>
                نام کاربری داخلی
                <input
                  required
                  value={form.username}
                  onChange={(event) =>
                    setField("username", event.target.value)
                  }
                  placeholder="مثلاً employee01"
                />
              </label>

              <label>
                رمز عبور
                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setField("password", event.target.value)
                  }
                  placeholder="حداقل ۶ کاراکتر"
                />
              </label>

              <label>
                سمت سازمانی
                <input
                  value={form.position}
                  onChange={(event) =>
                    setField("position", event.target.value)
                  }
                  placeholder="مثلاً مدیر عامل"
                />
              </label>

              <label>
                واحد / دپارتمان
                <input
                  value={form.department}
                  onChange={(event) =>
                    setField("department", event.target.value)
                  }
                  placeholder="مثلاً مدیریت تولید"
                />
              </label>

              <label>
                نقش سیستمی
                <select
                  value={form.role}
                  onChange={(event) => setField("role", event.target.value)}
                >
                  {roles.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                وضعیت
                <select
                  value={form.status}
                  onChange={(event) => setField("status", event.target.value)}
                >
                  <option value="Active">فعال</option>
                  <option value="Inactive">غیرفعال</option>
                </select>
              </label>
            </div>

            <div
              className="permission-box"
              style={{
                marginTop: 20,
                padding: 18,
                border: "1px solid rgba(0,0,0,.08)",
                borderRadius: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>دسترسی‌های پنل</h3>
                  <small>
                    مشخص کنید این کارمند به کدام بخش‌های سیستم دسترسی داشته
                    باشد.
                  </small>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={selectAllPermissions}>
                    انتخاب همه
                  </button>

                  <button type="button" onClick={clearPermissions}>
                    حذف همه
                  </button>
                </div>
              </div>

              <div
                className="permission-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 10,
                }}
              >
                {permissions.map(([key, label]) => (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "10px 12px",
                      border: "1px solid rgba(0,0,0,.08)",
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(key)}
                      onChange={() => togglePermission(key)}
                    />

                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="primary" type="submit" disabled={busy}>
              {busy ? "در حال ثبت..." : "ثبت کارمند"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
