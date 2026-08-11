import { Hono } from "hono";

const app = new Hono();

const COOKIE = "bipelc_session";
const SESSION_DAYS = 30;

const json = (c, data, status = 200) => c.json(data, status);

function uid(prefix = "id") {
  return `${prefix}_${crypto.randomUUID()}`;
}

function ticketNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const n = Math.floor(Math.random() * 90000) + 10000;
  return `BP-${y}-${n}`;
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const base = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    base, 256
  );
  return `pbkdf2$120000$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  try {
    // پشتیبانی از Hash قدیمی SHA-256
    // برای مهاجرت کاربران قدیمی پروژه
    if (!stored.startsWith("pbkdf2$")) {
      const legacyHash = await sha256(password);

      if (timingSafeEqual(
        new TextEncoder().encode(legacyHash),
        new TextEncoder().encode(stored)
      )) {
        return {
          valid: true,
          needsUpgrade: true
        };
      }

      return {
        valid: false,
        needsUpgrade: false
      };
    }

    // Hash جدید PBKDF2
    const [scheme, iter, saltB64, hashB64] = stored.split("$");

    if (scheme !== "pbkdf2") {
      return {
        valid: false,
        needsUpgrade: false
      };
    }

    const enc = new TextEncoder();
    const salt = unb64(saltB64);

    const base = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: Number(iter),
        hash: "SHA-256"
      },
      base,
      256
    );

    const valid = timingSafeEqual(
      new Uint8Array(bits),
      unb64(hashB64)
    );

    return {
      valid,
      needsUpgrade: false
    };

  } catch {
    return {
      valid: false,
      needsUpgrade: false
    };
  }
}


function b64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(str) {
  const s = atob(str);
  return Uint8Array.from(s, ch => ch.charCodeAt(0));
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a[i] ^ b[i];
  return x === 0;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function cookie(name, value, attrs = {}) {
  let s = `${name}=${encodeURIComponent(value)}`;
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) s += `; ${k}`;
    else if (v !== false && v != null) s += `; ${k}=${v}`;
  }
  return s;
}

function safeUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

async function currentUser(c) {
  const token = getCookie(c.req.header("Cookie") || "", COOKIE);
  if (!token) return null;
  const hash = await sha256(token);
  const row = await c.env.DB.prepare(`
    SELECT u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND datetime(s.expires_at) > datetime('now')
      AND u.status != 'Inactive'
    LIMIT 1
  `).bind(hash).first();
  return row || null;
}

function getCookie(header, name) {
  const found = header.split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null;
}

async function requireAuth(c, roles = null) {
  const user = await currentUser(c);
  if (!user) return json(c, { success: false, error: "احراز هویت لازم است." }, 401);
  if (roles && !roles.includes(user.role)) {
    return json(c, { success: false, error: "دسترسی ندارید." }, 403);
  }
  c.set("user", user);
  return null;
}

async function audit(c, userId, action, entityType, entityId, description) {
  try {
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (id,user_id,action,entity_type,entity_id,description)
      VALUES (?,?,?,?,?,?)
    `).bind(uid("log"), userId, action, entityType, entityId, description || null).run();
  } catch {}
}

app.get("/api/health", c => json(c, { success: true, service: "BIPELC OS", time: new Date().toISOString() }));

app.post("/api/auth/setup", async c => {
  const count = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM users").first();
  if (Number(count?.count || 0) > 0) {
    return json(c, { success: false, error: "سیستم قبلاً راه‌اندازی شده است." }, 409);
  }
  const body = await c.req.json();
  const { username, password, first_name, last_name, email } = body;
  if (!username || !password || password.length < 8 || !first_name || !last_name) {
    return json(c, { success: false, error: "نام کاربری، نام، نام خانوادگی و رمز حداقل ۸ کاراکتری لازم است." }, 400);
  }
  const userId = uid("usr");
  await c.env.DB.prepare(`
    INSERT INTO users
    (id,username,email,password_hash,first_name,last_name,full_name,role,department,job_title,employee_code)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    userId, username.trim(), email || null, await hashPassword(password),
    first_name.trim(), last_name.trim(), `${first_name.trim()} ${last_name.trim()}`,
    "Super Admin", "Management", "Founder / Super Admin", `ADM-${Date.now().toString().slice(-6)}`
  ).run();
  return json(c, { success: true, user: { id: userId, username, role: "Super Admin" } }, 201);
});

app.post("/api/auth/login", async c => {
  const body = await c.req.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const user = await c.env.DB.prepare(`
    SELECT * FROM users WHERE (username = ? OR email = ?) LIMIT 1
  `).bind(username, username).first();
 if (!user || user.status === "Inactive") {
  return json(c, {
    success: false,
    error: "نام کاربری یا رمز عبور اشتباه است."
  }, 401);
}

const passwordCheck = await verifyPassword(
  password,
  user.password_hash
);

if (!passwordCheck.valid) {
  return json(c, {
    success: false,
    error: "نام کاربری یا رمز عبور اشتباه است."
  }, 401);
}

// مهاجرت خودکار Hash قدیمی به PBKDF2
if (passwordCheck.needsUpgrade) {
  const newHash = await hashPassword(password);

  await c.env.DB.prepare(`
    UPDATE users
    SET password_hash = ?
    WHERE id = ?
  `).bind(newHash, user.id).run();

  user.password_hash = newHash;
}
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = b64(tokenBytes);
  const tokenHash = await sha256(token);
  const sessionId = uid("ses");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await c.env.DB.prepare(`
    INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)
  `).bind(sessionId, user.id, tokenHash, expires).run();
  await audit(c, user.id, "login", "user", user.id, "User logged in");
  return new Response(JSON.stringify({ success: true, user: safeUser(user) }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie(COOKIE, token, {
        HttpOnly: true, Secure: true, SameSite: "Lax", Path: "/", "Max-Age": SESSION_DAYS * 86400
      })
    }
  });
});

app.get("/api/auth/me", async c => {
  const user = await currentUser(c);
  return json(c, { success: !!user, user: safeUser(user) });
});

app.post("/api/auth/logout", async c => {
  const token = getCookie(c.req.header("Cookie") || "", COOKIE);
  if (token) {
    const hash = await sha256(token);
    await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run();
  }
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": cookie(COOKIE, "", { HttpOnly: true, Secure: true, SameSite: "Lax", Path: "/", "Max-Age": 0 }) }
  });
});

app.use("/api/*", async (c, next) => {
  if (c.req.path.startsWith("/api/auth/")) return next();
  const auth = await requireAuth(c);
  if (auth) return auth;
  return next();
});

app.get("/api/dashboard/stats", async c => {
  const [
    revenue, projects, overdue, requests, clients, expenses, debt
  ] = await Promise.all([
    c.env.DB.prepare(`SELECT COALESCE(SUM(amount),0) value FROM finances WHERE type='Income' AND strftime('%Y-%m',date)=strftime('%Y-%m','now')`).first(),
    c.env.DB.prepare(`SELECT COUNT(*) value FROM projects WHERE status IN ('Planning','Active','Internal Review','Client Review','Revision')`).first(),
    c.env.DB.prepare(`SELECT COUNT(*) value FROM tasks WHERE deadline < date('now') AND status != 'DONE'`).first(),
    c.env.DB.prepare(`SELECT COUNT(*) value FROM requests WHERE status IN ('Pending','Under Review','In Progress')`).first(),
    c.env.DB.prepare(`SELECT COUNT(*) value FROM clients WHERE status='New Lead'`).first(),
    c.env.DB.prepare(`SELECT COALESCE(SUM(amount),0) value FROM finances WHERE type='Expense' AND strftime('%Y-%m',date)=strftime('%Y-%m','now')`).first(),
    c.env.DB.prepare(`SELECT COALESCE(SUM(amount),0) value FROM invoices WHERE status IN ('Unpaid','Partially Paid','Overdue')`).first()
  ]);
  return json(c, {
    success: true,
    stats: {
      monthlyRevenue: revenue?.value || 0,
      activeProjects: projects?.value || 0,
      overdueTasks: overdue?.value || 0,
      pendingRequests: requests?.value || 0,
      newClients: clients?.value || 0,
      monthlyExpenses: expenses?.value || 0,
      customerDebt: debt?.value || 0,
      netProfit: Number(revenue?.value || 0) - Number(expenses?.value || 0)
    }
  });
});

app.get("/api/users", async c => {
  const rows = await c.env.DB.prepare(`
    SELECT id,username,email,first_name,last_name,full_name,phone,avatar_url,role,
           department,job_title,employment_type,employee_code,status,start_date,notes,created_at
    FROM users ORDER BY created_at DESC
  `).all();
  return json(c, { success: true, users: rows.results || [] });
});

app.post("/api/users", async c => {
  const me = c.get("user");
  if (!["Super Admin","Operations Manager"].includes(me.role)) return json(c, {success:false,error:"دسترسی ندارید."},403);
  const b = await c.req.json();
  if (!b.username || !b.password || !b.first_name || !b.last_name || !b.role) return json(c,{success:false,error:"اطلاعات ضروری ناقص است."},400);
  const id = uid("usr");
  try {
    await c.env.DB.prepare(`
      INSERT INTO users
      (id,username,email,password_hash,first_name,last_name,full_name,phone,role,department,job_title,employment_type,employee_code,status,start_date,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id,b.username.trim(),b.email||null,await hashPassword(b.password),
      b.first_name.trim(),b.last_name.trim(),`${b.first_name.trim()} ${b.last_name.trim()}`,
      b.phone||null,b.role,b.department||null,b.job_title||null,b.employment_type||null,
      b.employee_code||`EMP-${Date.now().toString().slice(-6)}`,b.status||"Active",b.start_date||null,b.notes||null
    ).run();
  } catch (e) {
    return json(c,{success:false,error:"نام کاربری یا کد کارمند تکراری است."},409);
  }
  await audit(c, me.id, "create", "user", id, `Created employee ${b.username}`);
  const user = await c.env.DB.prepare("SELECT id,username,email,first_name,last_name,full_name,phone,role,department,job_title,employment_type,employee_code,status,start_date,notes,created_at FROM users WHERE id=?").bind(id).first();
  return json(c,{success:true,user},201);
});

app.patch("/api/users/:id", async c => {
  const me = c.get("user");
  if (!["Super Admin","Operations Manager"].includes(me.role)) return json(c,{success:false,error:"دسترسی ندارید."},403);
  const id = c.req.param("id");
  const b = await c.req.json();
  const fields = ["first_name","last_name","email","phone","role","department","job_title","employment_type","employee_code","status","start_date","notes"];
  const sets = [], vals = [];
  for (const f of fields) if (b[f] !== undefined) { sets.push(`${f}=?`); vals.push(b[f]); }
  if (b.first_name !== undefined || b.last_name !== undefined) {
    const old = await c.env.DB.prepare("SELECT first_name,last_name FROM users WHERE id=?").bind(id).first();
    const fn = b.first_name ?? old?.first_name; const ln = b.last_name ?? old?.last_name;
    sets.push("full_name=?"); vals.push(`${fn} ${ln}`);
  }
  if (b.password) { sets.push("password_hash=?"); vals.push(await hashPassword(b.password)); }
  if (!sets.length) return json(c,{success:false,error:"چیزی برای تغییر ارسال نشده."},400);
  vals.push(id);
  await c.env.DB.prepare(`UPDATE users SET ${sets.join(",")}, updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(...vals).run();
  await audit(c, me.id, "update", "user", id, "Updated employee");
  return json(c,{success:true});
});

app.get("/api/tickets", async c => {
  const me = c.get("user");
  const where = ["1=1"], vals = [];
  if (!["Super Admin","Operations Manager","Project Manager"].includes(me.role)) {
    where.push("r.user_id=?"); vals.push(me.id);
  }
  const rows = await c.env.DB.prepare(`
    SELECT r.*, u.full_name requester_name
    FROM requests r JOIN users u ON u.id=r.user_id
    WHERE ${where.join(" AND ")}
    ORDER BY r.created_at DESC
  `).bind(...vals).all();
  return json(c,{success:true,tickets:rows.results||[]});
});

app.post("/api/tickets", async c => {
  const me = c.get("user");
  const b = await c.req.json();
  if (!b.type || !b.title) return json(c,{success:false,error:"نوع و عنوان درخواست الزامی است."},400);
  const id = uid("req");
  const number = ticketNumber();
  await c.env.DB.prepare(`
    INSERT INTO requests (id,ticket_number,user_id,type,title,description,priority)
    VALUES (?,?,?,?,?,?,?)
  `).bind(id,number,me.id,b.type,b.title,b.description||null,b.priority||"Medium").run();

  if (b.type === "Leave") {
    if (!b.start_date || !b.end_date) return json(c,{success:false,error:"تاریخ شروع و پایان مرخصی لازم است."},400);
    const days = Math.max(1, Math.ceil((new Date(b.end_date)-new Date(b.start_date))/86400000)+1);
    await c.env.DB.prepare(`
      INSERT INTO leave_requests (id,request_id,user_id,leave_type,start_date,end_date,days,reason)
      VALUES (?,?,?,?,?,?,?,?)
    `).bind(uid("leave"),id,me.id,b.leave_type||"Annual",b.start_date,b.end_date,days,b.reason||b.description||null).run();
  }
  if (b.type === "Purchase") {
    await c.env.DB.prepare(`
      INSERT INTO purchase_requests (id,request_id,item_name,category,estimated_cost,required_date,reason)
      VALUES (?,?,?,?,?,?,?)
    `).bind(uid("pur"),id,b.item_name||b.title,b.category||null,Number(b.estimated_cost||0),b.required_date||null,b.reason||b.description||null).run();
  }
  await audit(c, me.id, "create", "request", id, `Created ticket ${number}`);
  return json(c,{success:true,ticket_number:number,id},201);
});

app.patch("/api/tickets/:id", async c => {
  const me = c.get("user");
  if (!["Super Admin","Operations Manager","Project Manager"].includes(me.role)) return json(c,{success:false,error:"دسترسی ندارید."},403);
  const id = c.req.param("id"), b = await c.req.json();
  await c.env.DB.prepare(`
    UPDATE requests SET status=COALESCE(?,status), priority=COALESCE(?,priority),
      assigned_to=COALESCE(?,assigned_to), manager_reply=COALESCE(?,manager_reply),
      updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).bind(b.status||null,b.priority||null,b.assigned_to||null,b.manager_reply||null,id).run();
  await audit(c, me.id, "update", "request", id, "Updated ticket");
  return json(c,{success:true});
});

app.get("/api/conversations", async c => {
  const me = c.get("user");
  const rows = await c.env.DB.prepare(`
    SELECT c.*,
      (SELECT m.message FROM messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) last_message,
      (SELECT m.created_at FROM messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) last_message_at
    FROM conversations c
    JOIN conversation_members cm ON cm.conversation_id=c.id
    WHERE cm.user_id=?
    ORDER BY COALESCE(last_message_at,c.created_at) DESC
  `).bind(me.id).all();
  return json(c,{success:true,conversations:rows.results||[]});
});

app.post("/api/conversations", async c => {
  const me = c.get("user"), b = await c.req.json();
  const id = uid("conv");
  await c.env.DB.prepare(`
    INSERT INTO conversations (id,type,title,project_id,created_by) VALUES (?,?,?,?,?)
  `).bind(id,b.type||"group",b.title||"گفتگو",b.project_id||null,me.id).run();
  const members = [...new Set([me.id,...(b.user_ids||[])])];
  for (const userId of members) {
    await c.env.DB.prepare("INSERT OR IGNORE INTO conversation_members (conversation_id,user_id) VALUES (?,?)").bind(id,userId).run();
  }
  return json(c,{success:true,id},201);
});

app.get("/api/conversations/:id/messages", async c => {
  const me = c.get("user"), id = c.req.param("id");
  const member = await c.env.DB.prepare("SELECT 1 FROM conversation_members WHERE conversation_id=? AND user_id=?").bind(id,me.id).first();
  if (!member) return json(c,{success:false,error:"دسترسی ندارید."},403);
  const rows = await c.env.DB.prepare(`
    SELECT m.*, u.full_name sender_name
    FROM messages m JOIN users u ON u.id=m.sender_id
    WHERE m.conversation_id=? ORDER BY m.created_at ASC
  `).bind(id).all();
  return json(c,{success:true,messages:rows.results||[]});
});

app.post("/api/conversations/:id/messages", async c => {
  const me = c.get("user"), id = c.req.param("id"), b = await c.req.json();
  const member = await c.env.DB.prepare("SELECT 1 FROM conversation_members WHERE conversation_id=? AND user_id=?").bind(id,me.id).first();
  if (!member) return json(c,{success:false,error:"دسترسی ندارید."},403);
  if (!b.message?.trim()) return json(c,{success:false,error:"پیام خالی است."},400);
  const mid = uid("msg");
  await c.env.DB.prepare(`
    INSERT INTO messages (id,conversation_id,sender_id,message,reply_to_id) VALUES (?,?,?,?,?)
  `).bind(mid,id,me.id,b.message.trim(),b.reply_to_id||null).run();
  return json(c,{success:true,id:mid},201);
});

app.get("/api/finance", async c => {
  const me = c.get("user");
  if (!["Super Admin","Operations Manager"].includes(me.role)) return json(c,{success:false,error:"دسترسی ندارید."},403);
  const rows = await c.env.DB.prepare("SELECT * FROM finances ORDER BY date DESC, created_at DESC LIMIT 200").all();
  return json(c,{success:true,items:rows.results||[]});
});

app.post("/api/finance", async c => {
  const me = c.get("user");
  if (!["Super Admin","Operations Manager"].includes(me.role)) return json(c,{success:false,error:"دسترسی ندارید."},403);
  const b = await c.req.json();
  if (!b.type || !b.category || !b.amount || !b.date) return json(c,{success:false,error:"نوع، دسته، مبلغ و تاریخ الزامی است."},400);
  const id = uid("fin");
  await c.env.DB.prepare(`
    INSERT INTO finances (id,type,category,amount,project_id,client_id,freelancer_id,description,date,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).bind(id,b.type,b.category,Number(b.amount),b.project_id||null,b.client_id||null,b.freelancer_id||null,b.description||null,b.date,me.id).run();
  return json(c,{success:true,id},201);
});

app.get("/api/projects", async c => {
  const rows = await c.env.DB.prepare(`
    SELECT p.*, c.company_name client_name, u.full_name manager_name
    FROM projects p
    LEFT JOIN clients c ON c.id=p.client_id
    LEFT JOIN users u ON u.id=p.project_manager_id
    ORDER BY p.created_at DESC
  `).all();
  return json(c,{success:true,projects:rows.results||[]});
});

app.post("/api/projects", async c => {
  const me = c.get("user");
  if (!["Super Admin","Operations Manager","Project Manager"].includes(me.role)) return json(c,{success:false,error:"دسترسی ندارید."},403);
  const b = await c.req.json();
  if (!b.title) return json(c,{success:false,error:"عنوان پروژه الزامی است."},400);
  const id = uid("prj");
  await c.env.DB.prepare(`
    INSERT INTO projects (id,title,description,brief,client_id,account_manager_id,project_manager_id,budget,estimated_cost,start_date,deadline,priority,status,progress)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(id,b.title,b.description||null,b.brief||null,b.client_id||null,b.account_manager_id||null,b.project_manager_id||me.id,Number(b.budget||0),Number(b.estimated_cost||0),b.start_date||null,b.deadline||null,b.priority||"Medium",b.status||"Planning",Number(b.progress||0)).run();
  return json(c,{success:true,id},201);
});

export default {
  fetch: app.fetch
};
