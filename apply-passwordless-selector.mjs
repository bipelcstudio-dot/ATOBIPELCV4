import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'src', 'index.js');
if (!fs.existsSync(indexPath)) throw new Error('src/index.js پیدا نشد. این فایل را در ریشه پروژه اجرا کنید.');

let src = fs.readFileSync(indexPath, 'utf8');
const backup = indexPath + '.before-passwordless-selector.bak';
if (!fs.existsSync(backup)) fs.writeFileSync(backup, src);

if (!src.includes('app.get("/api/auth/users"')) {
  const marker = 'app.get("/api/auth/me"';
  const at = src.indexOf(marker);
  if (at < 0) throw new Error('Route مربوط به /api/auth/me در src/index.js پیدا نشد.');
  const block = `
// ---- BIPELC passwordless employee selector ----
app.get("/api/auth/users", async c => {
  try {
    let rows;
    try {
      rows = await c.env.DB.prepare(` + "`" + `
        SELECT id, username, full_name, role, position, job_title, department, status, permissions
        FROM users
        WHERE COALESCE(status,'Active') != 'Inactive'
        ORDER BY full_name COLLATE NOCASE ASC
      ` + "`" + `).all();
    } catch {
      rows = await c.env.DB.prepare(` + "`" + `
        SELECT id, username, full_name, role, position, status, permissions
        FROM users
        WHERE COALESCE(status,'Active') != 'Inactive'
        ORDER BY full_name COLLATE NOCASE ASC
      ` + "`" + `).all();
    }
    return json(c, { success: true, users: rows.results || [] });
  } catch (e) {
    return json(c, { success: false, error: "فهرست کارکنان قابل دریافت نیست." }, 500);
  }
});

app.post("/api/auth/select", async c => {
  try {
    const body = await c.req.json();
    const userId = String(body.user_id || '').trim();
    if (!userId) return json(c, { success:false, error:"کاربر انتخاب نشده است." }, 400);

    const user = await c.env.DB.prepare(` + "`" + `
      SELECT * FROM users WHERE id = ? AND COALESCE(status,'Active') != 'Inactive' LIMIT 1
    ` + "`" + `).bind(userId).first();
    if (!user) return json(c, { success:false, error:"این کاربر فعال نیست یا وجود ندارد." }, 404);

    const token = b64(crypto.getRandomValues(new Uint8Array(32)));
    const tokenHash = await sha256(token);
    const sessionId = uid('ses');
    const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
    await c.env.DB.prepare(` + "`" + `
      INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)
    ` + "`" + `).bind(sessionId, user.id, tokenHash, expires).run();

    await audit(c, user.id, 'login', 'user', user.id, 'Passwordless employee selection');
    const secure = new URL(c.req.url).protocol === 'https:';
    return new Response(JSON.stringify({ success:true, user:safeUser(user) }), {
      status:200,
      headers:{
        'Content-Type':'application/json',
        'Set-Cookie': cookie(COOKIE, token, {
          HttpOnly:true, Secure:secure, SameSite:'Lax', Path:'/', 'Max-Age':SESSION_DAYS*86400
        })
      }
    });
  } catch (e) {
    return json(c, { success:false, error:"ورود به حساب انجام نشد." }, 500);
  }
});

`;
  src = src.slice(0, at) + block + src.slice(at);
}

// Replace the users list endpoint with a schema-tolerant implementation.
const usersStart = src.indexOf('app.get("/api/users"');
const usersPostStart = src.indexOf('app.post("/api/users"');
if (usersStart >= 0 && usersPostStart > usersStart) {
  const replacement = `app.get("/api/users", async c => {
  const auth = await requireAuth(c, ["Super Admin","Operations Manager"]);
  if (auth) return auth;
  try {
    const rows = await c.env.DB.prepare(` + "`" + `SELECT * FROM users ORDER BY created_at DESC` + "`" + `).all();
    return json(c, { success:true, users:(rows.results||[]).map(safeUser) });
  } catch (e) {
    return json(c, { success:false, error:"فهرست کارکنان قابل دریافت نیست." }, 500);
  }
});

`;
  src = src.slice(0, usersStart) + replacement + src.slice(usersPostStart);
}

// Replace the create-user endpoint up to the PATCH endpoint.
const postStart = src.indexOf('app.post("/api/users"');
const patchStart = src.indexOf('app.patch("/api/users/:id"');
if (postStart >= 0 && patchStart > postStart) {
  const replacement = `app.post("/api/users", async c => {
  const me = c.get("user");
  if (!["Super Admin","Operations Manager"].includes(me.role)) return json(c,{success:false,error:"دسترسی ندارید."},403);
  const b = await c.req.json();
  const fullName = String(b.full_name || ((b.first_name || "") + " " + (b.last_name || ""))).trim();
  if (!fullName || !b.role) return json(c,{success:false,error:"نام و نقش کارمند الزامی است."},400);
  const id = uid('usr');
  const username = String(b.username || fullName.toLowerCase().replace(/\\s+/g,'_') + '_' + Date.now().toString().slice(-4)).trim();
  const passwordHash = await hashPassword(uid('disabled-password'));
  try {
    // Full schema (current schema.sql)
    await c.env.DB.prepare(` + "`" + `
      INSERT INTO users (id,username,email,password_hash,first_name,last_name,full_name,phone,role,department,job_title,employment_type,employee_code,status,start_date,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ` + "`" + `).bind(
      id, username, b.email||null, passwordHash,
      b.first_name||fullName.split(' ')[0]||fullName, b.last_name||fullName.split(' ').slice(1).join(' ')||'', fullName,
      b.phone||null, b.role, b.department||null, b.job_title||b.position||null, b.employment_type||'Employee',
      b.employee_code||("EMP-" + Date.now().toString().slice(-6)), b.status||'Active', b.start_date||null, b.notes||null
    ).run();
  } catch (fullErr) {
    try {
      // Legacy/live schema used by the earlier deployment.
      await c.env.DB.prepare(` + "`" + `
        INSERT INTO users (id,username,password_hash,full_name,role,position,salary,employment_date,status,permissions)
        VALUES (?,?,?,?,?,?,?,?,?,?)
      ` + "`" + `).bind(
        id, username, passwordHash, fullName, b.role, b.position||b.job_title||null,
        Number(b.salary||0), b.employment_date||b.start_date||null, b.status||'Active', b.permissions||'[]'
      ).run();
    } catch (legacyErr) {
      return json(c,{success:false,error:'ثبت کارمند در دیتابیس انجام نشد. Schema دیتابیس را بررسی کنید.'},500);
    }
  }
  try { await audit(c, me.id, 'create', 'user', id, "Created employee " + fullName); } catch {}
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
  return json(c,{success:true,user:safeUser(user)},201);
});

`;
  src = src.slice(0, postStart) + replacement + src.slice(patchStart);
}

fs.writeFileSync(indexPath, src);
console.log('BIPELC passwordless selector backend applied successfully.');
