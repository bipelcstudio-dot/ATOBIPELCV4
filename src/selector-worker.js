import worker from "./index.js";

const COOKIE = "bipelc_session";
const SESSION_DAYS = 30;

function b64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

async function sha256(text) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return [...new Uint8Array(digest)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

function cookie(name, value, attrs = {}) {
  let s = `${name}=${encodeURIComponent(value)}`;
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) s += `; ${k}`;
    else if (v !== false && v != null) s += `; ${k}=${v}`;
  }
  return s;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Public list used by the employee selector.
    if (url.pathname === "/api/auth/users" && request.method === "GET") {
      try {
        const rows = await env.DB.prepare(`
          SELECT id, username, full_name, role, position, status, permissions
          FROM users
          WHERE status != 'Inactive'
          ORDER BY full_name COLLATE NOCASE ASC
        `).all();

        return json({ success: true, users: rows.results || [] });
      } catch (error) {
        return json(
          { success: false, error: "امکان دریافت فهرست کارکنان وجود ندارد." },
          500
        );
      }
    }

    // Passwordless employee selection -> creates the normal server session.
    if (url.pathname === "/api/auth/select" && request.method === "POST") {
      try {
        const body = await request.json();
        const userId = String(body.user_id || "").trim();

        if (!userId) {
          return json({ success: false, error: "کاربر انتخاب نشده است." }, 400);
        }

        const user = await env.DB.prepare(`
          SELECT id, username, full_name, role, position, status, permissions
          FROM users
          WHERE id = ? AND status != 'Inactive'
          LIMIT 1
        `).bind(userId).first();

        if (!user) {
          return json(
            { success: false, error: "این کاربر فعال نیست یا وجود ندارد." },
            404
          );
        }

        const token = b64(crypto.getRandomValues(new Uint8Array(32)));
        const tokenHash = await sha256(token);
        const sessionId = `ses_${crypto.randomUUID()}`;
        const expires = new Date(
          Date.now() + SESSION_DAYS * 86400000
        ).toISOString();

        await env.DB.prepare(`
          INSERT INTO sessions (id, user_id, token_hash, expires_at)
          VALUES (?, ?, ?, ?)
        `).bind(sessionId, user.id, tokenHash, expires).run();

        return json(
          { success: true, user },
          200,
          {
            "Set-Cookie": cookie(COOKIE, token, {
              HttpOnly: true,
              Secure: true,
              SameSite: "Lax",
              Path: "/",
              "Max-Age": SESSION_DAYS * 86400
            })
          }
        );
      } catch (error) {
        return json(
          { success: false, error: "ورود به حساب انجام نشد." },
          500
        );
      }
    }

    return worker.fetch(request, env, ctx);
  }
};
