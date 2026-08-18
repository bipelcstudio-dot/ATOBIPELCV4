const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extra
    }
  });

const uid = () => crypto.randomUUID();
const enc = new TextEncoder();

const hex = (b) =>
  [...new Uint8Array(b)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

async function sha256(v) {
  return hex(
    await crypto.subtle.digest(
      "SHA-256",
      enc.encode(String(v))
    )
  );
}

async function body(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function token(req) {
  const c = req.headers.get("cookie") || "";
  const m = c.match(/(?:^|; )bp_session=([^;]+)/);

  return m
    ? decodeURIComponent(m[1])
    : (
        (req.headers.get("authorization") || "")
          .replace(/^Bearer\s+/i, "")
          || null
      );
}

async function tableExists(env, table) {
  try {
    return !!(
      await env.DB
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
        )
        .bind(table)
        .first()
    );
  } catch {
    return false;
  }
}

async function cols(env, table) {
  try {
    const result = await env.DB
      .prepare(`PRAGMA table_info(${table})`)
      .all();

    return new Set(
      (result.results || []).map((x) => x.name)
    );
  } catch {
    return new Set();
  }
}

/* =========================================================
   AUTH
========================================================= */

async function auth(req, env) {
  const t = token(req);

  if (!t) return null;

  if (!(await tableExists(env, "sessions"))) {
    return null;
  }

  try {
    return await env.DB
      .prepare(`
        SELECT u.*
        FROM sessions s
        JOIN users u ON u.id=s.user_id
        WHERE s.token_hash=?
          AND s.expires_at>?
          AND u.status='Active'
      `)
      .bind(
        await sha256(t),
        new Date().toISOString()
      )
      .first();
  } catch {
    return null;
  }
}

/* =========================================================
   RESOURCES
========================================================= */

const RESOURCE = {
  users: {
    table: "users",
    label: "کارمندان",
    perm: "employees",
    search: "full_name"
  },

  clients: {
    table: "clients",
    label: "مشتریان",
    perm: "clients",
    search: "company_name"
  },

  projects: {
    table: "projects",
    label: "پروژه‌ها",
    perm: "projects",
    search: "title"
  },

  tasks: {
    table: "tasks",
    label: "تسک‌ها",
    perm: "projects",
    search: "title"
  },

  freelancers: {
    table: "freelancers",
    label: "فریلنسرها",
    perm: "projects",
    search: "name"
  },

  attendance: {
    table: "attendance",
    label: "حضور و غیاب",
    perm: "hr",
    search: "date"
  },

  evaluations: {
    table: "evaluations",
    label: "ارزیابی‌ها",
    perm: "hr",
    search: "month"
  },

  contracts: {
    table: "contracts",
    label: "قراردادها",
    perm: "legal",
    search: "title"
  },

  finances: {
    table: "finances",
    label: "مالی",
    perm: "finance",
    search: "description"
  },

  invoices: {
    table: "invoices",
    label: "فاکتورها",
    perm: "finance",
    search: "invoice_number"
  },

  requests: {
    table: "requests",
    label: "درخواست‌ها",
    perm: "requests",
    search: "title"
  },

  leave_requests: {
    table: "leave_requests",
    label: "مرخصی",
    perm: "hr",
    search: "reason"
  },

  conversations: {
    table: "conversations",
    label: "گفتگوها",
    perm: "chat",
    search: "title"
  },

  messages: {
    table: "messages",
    label: "پیام‌ها",
    perm: "chat",
    search: "message"
  }
};

const allowed = {
  users: [
    "username",
    "full_name",
    "email",
    "phone",
    "role",
    "position",
    "department",
    "job_title",
    "employment_type",
    "start_date",
    "salary",
    "status",
    "permissions",
    "employee_code",
    "notes"
  ],

  clients: [
    "company_name",
    "contact_person",
    "phone",
    "email",
    "website",
    "instagram",
    "industry",
    "company_size",
    "status",
    "score",
    "notes"
  ],

  projects: [
    "title",
    "client_id",
    "manager_id",
    "description",
    "budget",
    "start_date",
    "deadline",
    "priority",
    "status",
    "progress"
  ],

  tasks: [
    "title",
    "project_id",
    "assigned_to",
    "priority",
    "status",
    "deadline",
    "description"
  ],

  freelancers: [
    "name",
    "specialty",
    "phone",
    "email",
    "city",
    "portfolio",
    "rate",
    "equipment",
    "experience",
    "availability",
    "status",
    "notes"
  ],

  attendance: [
    "user_id",
    "date",
    "check_in",
    "check_out",
    "type",
    "notes"
  ],

  evaluations: [
    "user_id",
    "month",
    "quality",
    "speed",
    "responsibility",
    "teamwork",
    "notes",
    "evaluated_by"
  ],

  contracts: [
    "type",
    "title",
    "client_id",
    "freelancer_id",
    "employee_id",
    "project_id",
    "contract_number",
    "start_date",
    "end_date",
    "amount",
    "status",
    "file_url",
    "notes"
  ],

  finances: [
    "type",
    "category",
    "amount",
    "project_id",
    "client_id",
    "freelancer_id",
    "description",
    "date"
  ],

  invoices: [
    "invoice_number",
    "client_id",
    "project_id",
    "amount",
    "paid_amount",
    "due_date",
    "status"
  ],

  requests: [
    "type",
    "title",
    "description",
    "priority",
    "status",
    "assigned_to",
    "manager_reply"
  ],

  leave_requests: [
    "user_id",
    "leave_type",
    "start_date",
    "end_date",
    "days",
    "reason",
    "status",
    "approved_by"
  ],

  conversations: [
    "type",
    "title",
    "project_id"
  ],

  messages: [
    "conversation_id",
    "message"
  ]
};

const ALL = new Set([
  "Super Admin",
  "Operations Manager"
]);

/* =========================================================
   PERMISSIONS
========================================================= */

async function permissions(env, u) {
  if (!u) return [];

  if (ALL.has(u.role)) {
    return [
      "dashboard",
      "employees",
      "clients",
      "projects",
      "tasks",
      "freelancers",
      "hr",
      "legal",
      "finance",
      "requests",
      "chat",
      "reports",
      "users.permissions"
    ];
  }

  let p = [];

  try {
    if (await tableExists(env, "permissions")) {
      p = (
        await env.DB
          .prepare(`
            SELECT p.key
            FROM role_permissions rp
            JOIN permissions p
              ON p.id=rp.permission_id
            WHERE rp.role=?
          `)
          .bind(u.role)
          .all()
      ).results.map((x) => x.key);

      if (await tableExists(env, "user_permissions")) {
        for (
          const x of (
            await env.DB
              .prepare(`
                SELECT p.key, up.allowed
                FROM user_permissions up
                JOIN permissions p
                  ON p.id=up.permission_id
                WHERE up.user_id=?
              `)
              .bind(u.id)
              .all()
          ).results
        ) {
          if (x.allowed) {
            p.push(x.key);
          } else {
            p = p.filter((k) => k !== x.key);
          }
        }
      }
    }
  } catch {}

  try {
    if (u.permissions) {
      const x = JSON.parse(u.permissions);

      p.push(
        ...(Array.isArray(x)
          ? x
          : Object.keys(x).filter((k) => x[k]))
      );
    }
  } catch {}

  return [...new Set(p)];
}

function can(u, permissionsList, need) {
  if (!u) return false;

  if (ALL.has(u.role)) return true;

  return (
    permissionsList.includes(need) ||
    permissionsList.includes(`${need}.view`) ||
    permissionsList.includes(`${need}.all`)
  );
}

/* =========================================================
   ACTIVITY LOG
========================================================= */

async function log(env, u, action, type, entityId) {
  try {
    if (await tableExists(env, "activity_logs")) {
      await env.DB
        .prepare(`
          INSERT INTO activity_logs
          (
            id,
            user_id,
            action,
            entity_type,
            entity_id
          )
          VALUES(?,?,?,?,?)
        `)
        .bind(
          uid(),
          u?.id || null,
          action,
          type,
          entityId || null
        )
        .run();
    }
  } catch {}
}

/* =========================================================
   CHAT DATABASE
========================================================= */

async function ensureChatTables(env) {
  await env.DB
    .prepare(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'private',
        title TEXT,
        project_id TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
    .run();

  await env.DB
    .prepare(`
      CREATE TABLE IF NOT EXISTS conversation_members (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        UNIQUE(conversation_id,user_id)
      )
    `)
    .run();

  await env.DB
    .prepare(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
    .run();

  await env.DB
    .prepare(`
      CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation
      ON conversation_members(conversation_id)
    `)
    .run();

  await env.DB
    .prepare(`
      CREATE INDEX IF NOT EXISTS idx_conversation_members_user
      ON conversation_members(user_id)
    `)
    .run();

  await env.DB
    .prepare(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(conversation_id,created_at)
    `)
    .run();
}

async function isConversationMember(env, conversationId, userId) {
  const row = await env.DB
    .prepare(`
      SELECT 1
      FROM conversation_members
      WHERE conversation_id=?
        AND user_id=?
      LIMIT 1
    `)
    .bind(conversationId, userId)
    .first();

  return !!row;
}

/* =========================================================
   CHAT CONTACTS
========================================================= */

async function chatContacts(env, u, url) {
  if (!(await tableExists(env, "users"))) {
    return json({
      items: []
    });
  }

  const q = String(
    url.searchParams.get("q") || ""
  ).trim();

  const c = await cols(env, "users");

  const fields = [
    "id",
    c.has("full_name") ? "full_name" : "NULL AS full_name",
    c.has("username") ? "username" : "NULL AS username",
    c.has("role") ? "role" : "NULL AS role",
    c.has("status") ? "status" : "NULL AS status"
  ];

  let sql = `
    SELECT ${fields.join(",")}
    FROM users
    WHERE id != ?
  `;

  const params = [u.id];

  if (c.has("status")) {
    sql += ` AND status='Active'`;
  }

  if (q) {
    const searchParts = [];

    if (c.has("full_name")) {
      searchParts.push("full_name LIKE ?");
      params.push(`%${q}%`);
    }

    if (c.has("username")) {
      searchParts.push("username LIKE ?");
      params.push(`%${q}%`);
    }

    if (searchParts.length) {
      sql += ` AND (${searchParts.join(" OR ")})`;
    }
  }

  sql += ` ORDER BY full_name LIMIT 200`;

  try {
    return json({
      items: (
        await env.DB
          .prepare(sql)
          .bind(...params)
          .all()
      ).results
    });
  } catch (e) {
    return json({
      error: e.message || "خطا در دریافت کاربران"
    }, 400);
  }
}

/* =========================================================
   CONVERSATIONS
========================================================= */

async function listConversations(env, u) {
  await ensureChatTables(env);

  try {
    const rows = (
      await env.DB
        .prepare(`
          SELECT
            c.*,
            (
              SELECT message
              FROM messages m
              WHERE m.conversation_id=c.id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS last_message,
            (
              SELECT created_at
              FROM messages m
              WHERE m.conversation_id=c.id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS last_message_at
          FROM conversations c
          JOIN conversation_members cm
            ON cm.conversation_id=c.id
          WHERE cm.user_id=?
          ORDER BY
            COALESCE(last_message_at,c.created_at) DESC
        `)
        .bind(u.id)
        .all()
    ).results;

    const output = [];

    for (const conversation of rows) {
      const members = (
        await env.DB
          .prepare(`
            SELECT
              u.id,
              u.full_name,
              u.username,
              u.role,
              u.status
            FROM conversation_members cm
            JOIN users u
              ON u.id=cm.user_id
            WHERE cm.conversation_id=?
            ORDER BY u.full_name
          `)
          .bind(conversation.id)
          .all()
      ).results;

      output.push({
        ...conversation,
        members
      });
    }

    return json({
      items: output
    });
  } catch (e) {
    return json({
      error: e.message || "خطا در دریافت گفتگوها"
    }, 400);
  }
}

async function createConversation(env, u, b) {
  await ensureChatTables(env);

  const type =
    b.type === "group"
      ? "group"
      : "private";

  let userIds = Array.isArray(b.user_ids)
    ? b.user_ids.map(String)
    : [];

  userIds = [...new Set(
    userIds.filter(Boolean)
  )];

  if (!userIds.includes(String(u.id))) {
    userIds.push(String(u.id));
  }

  if (type === "private") {
    if (userIds.length !== 2) {
      return json({
        error:
          "گفتگوی خصوصی باید دقیقاً بین دو کاربر باشد"
      }, 400);
    }

    const otherId =
      userIds.find(
        (id) => id !== String(u.id)
      );

    if (!otherId) {
      return json({
        error:
          "کاربر مقصد مشخص نشده است"
      }, 400);
    }

    const other = await env.DB
      .prepare(`
        SELECT id
        FROM users
        WHERE id=?
        LIMIT 1
      `)
      .bind(otherId)
      .first();

    if (!other) {
      return json({
        error:
          "کاربر مقصد وجود ندارد"
      }, 404);
    }

    const existing = await env.DB
      .prepare(`
        SELECT c.id
        FROM conversations c
        JOIN conversation_members cm1
          ON cm1.conversation_id=c.id
        JOIN conversation_members cm2
          ON cm2.conversation_id=c.id
        WHERE c.type='private'
          AND cm1.user_id=?
          AND cm2.user_id=?
        LIMIT 1
      `)
      .bind(
        String(u.id),
        otherId
      )
      .first();

    if (existing) {
      return json({
        ok: true,
        id: existing.id,
        existing: true
      });
    }
  }

  if (type === "group" && userIds.length < 2) {
    return json({
      error:
        "گروه باید حداقل دو عضو داشته باشد"
    }, 400);
  }

  for (const userId of userIds) {
    const exists = await env.DB
      .prepare(`
        SELECT id
        FROM users
        WHERE id=?
        LIMIT 1
      `)
      .bind(userId)
      .first();

    if (!exists) {
      return json({
        error:
          `کاربر ${userId} وجود ندارد`
      }, 400);
    }
  }

  const id = uid();

  await env.DB
    .prepare(`
      INSERT INTO conversations
      (
        id,
        type,
        title,
        project_id,
        created_by,
        created_at
      )
      VALUES(?,?,?,?,?,?)
    `)
    .bind(
      id,
      type,
      b.title || null,
      b.project_id || null,
      u.id,
      new Date().toISOString()
    )
    .run();

  for (const userId of userIds) {
    await env.DB
      .prepare(`
        INSERT OR IGNORE INTO conversation_members
        (
          id,
          conversation_id,
          user_id,
          joined_at
        )
        VALUES(?,?,?,?)
      `)
      .bind(
        uid(),
        id,
        userId,
        new Date().toISOString()
      )
      .run();
  }

  return json({
    ok: true,
    id
  }, 201);
}

/* =========================================================
   GET MESSAGES
========================================================= */

async function getMessages(env, u, conversationId) {
  await ensureChatTables(env);

  if (
    !(await isConversationMember(
      env,
      conversationId,
      u.id
    ))
  ) {
    return json({
      error: "دسترسی غیرمجاز"
    }, 403);
  }

  try {
    const messages = (
      await env.DB
        .prepare(`
          SELECT
            m.*,
            u.full_name AS sender_name,
            u.username AS sender_username,
            u.role AS sender_role
          FROM messages m
          LEFT JOIN users u
            ON u.id=m.sender_id
          WHERE m.conversation_id=?
          ORDER BY m.created_at ASC
          LIMIT 1000
        `)
        .bind(conversationId)
        .all()
    ).results;

    return json({
      items: messages
    });
  } catch (e) {
    return json({
      error:
        e.message ||
        "خطا در دریافت پیام‌ها"
    }, 400);
  }
}

/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(env, u, conversationId, b) {
  await ensureChatTables(env);

  if (
    !(await isConversationMember(
      env,
      conversationId,
      u.id
    ))
  ) {
    return json({
      error: "دسترسی غیرمجاز"
    }, 403);
  }

  const message =
    typeof b.message === "string"
      ? b.message.trim()
      : "";

  if (!message) {
    return json({
      error:
        "متن پیام نمی‌تواند خالی باشد"
    }, 400);
  }

  if (message.length > 10000) {
    return json({
      error:
        "پیام بیش از حد طولانی است"
    }, 400);
  }

  const id = uid();

  try {
    await env.DB
      .prepare(`
        INSERT INTO messages
        (
          id,
          conversation_id,
          sender_id,
          message,
          created_at
        )
        VALUES(?,?,?,?,?)
      `)
      .bind(
        id,
        conversationId,
        u.id,
        message,
        new Date().toISOString()
      )
      .run();

    return json({
      ok: true,
      id
    }, 201);
  } catch (e) {
    return json({
      error:
        e.message ||
        "ارسال پیام انجام نشد"
    }, 400);
  }
}

/* =========================================================
   DASHBOARD
========================================================= */

async function dashboard(env) {
  const q = async (sql) =>
    Number(
      (await env.DB.prepare(sql).first())?.n || 0
    );

  const out = {};

  const safe = async (key, sql) => {
    try {
      out[key] = await q(sql);
    } catch {
      out[key] = 0;
    }
  };

  await safe(
    "monthlyRevenue",
    `
      SELECT COALESCE(SUM(amount),0)n
      FROM finances
      WHERE type IN ('income','revenue')
      AND substr(date,1,7)=substr(date('now'),1,7)
    `
  );

  await safe(
    "monthlyExpenses",
    `
      SELECT COALESCE(SUM(amount),0)n
      FROM finances
      WHERE type='expense'
      AND substr(date,1,7)=substr(date('now'),1,7)
    `
  );

  await safe(
    "activeProjects",
    `
      SELECT COUNT(*)n
      FROM projects
      WHERE status NOT IN
      (
        'Completed',
        'Cancelled',
        'تکمیل شده',
        'لغو شده'
      )
    `
  );

  await safe(
    "overdueProjects",
    `
      SELECT COUNT(*)n
      FROM projects
      WHERE deadline < date('now')
      AND status NOT IN
      (
        'Completed',
        'Cancelled',
        'تکمیل شده',
        'لغو شده'
      )
    `
  );

  await safe(
    "newClients",
    `
      SELECT COUNT(*)n
      FROM clients
      WHERE substr(created_at,1,7)
      =substr(date('now'),1,7)
    `
  );

  await safe(
    "pendingClients",
    `
      SELECT COUNT(*)n
      FROM clients
      WHERE status IN
      (
        'New Lead',
        'Contacted',
        'Proposal Sent',
        'Negotiation',
        'لید جدید',
        'تماس گرفته شده',
        'جلسه برگزار شده',
        'پیشنهاد ارسال شده',
        'مذاکره'
      )
    `
  );

  await safe(
    "customerDebt",
    `
      SELECT COALESCE(
        SUM(amount-paid_amount),
        0
      )n
      FROM invoices
      WHERE status!='Paid'
    `
  );

  await safe(
    "upcomingPayments",
    `
      SELECT COALESCE(
        SUM(amount-paid_amount),
        0
      )n
      FROM invoices
      WHERE due_date
      BETWEEN date('now')
      AND date('now','+14 day')
      AND status!='Paid'
    `
  );

  out.netProfit =
    (out.monthlyRevenue || 0) -
    (out.monthlyExpenses || 0);

  return out;
}

/* =========================================================
   CREATE RESOURCE
========================================================= */

async function create(env, u, resource, b) {
  const cfg = RESOURCE[resource];

  if (!cfg) {
    return json({
      error: "منبع نامعتبر است"
    }, 400);
  }

  const table = cfg.table;
  const c = await cols(env, table);

  const data = {
    ...b
  };

  if (
    resource === "users" &&
    c.has("permissions") &&
    data.permissions === undefined
  ) {
    data.permissions = "[]";
  }

  /*
   * USERNAME IS OPTIONAL
   */

  if (resource === "users") {
    if (
      c.has("username") &&
      !data.username
    ) {
      data.username =
        `user_${uid().replaceAll("-", "").slice(0, 12)}`;
    }

    if (
      c.has("position") &&
      !data.position &&
      data.job_title
    ) {
      data.position = data.job_title;
    }

    if (
      c.has("employment_date") &&
      !data.employment_date &&
      data.start_date
    ) {
      data.employment_date =
        data.start_date;
    }

    if (
      c.has("password_hash") &&
      data.password !== undefined
    ) {
      data.password_hash =
        await sha256(data.password || "");

      delete data.password;
    }
  }

  if (
    resource === "requests" &&
    c.has("user_id")
  ) {
    data.user_id = u.id;
  }

  if (
    resource === "leave_requests" &&
    c.has("user_id") &&
    !data.user_id
  ) {
    data.user_id = u.id;
  }

  /*
   * CREATED_BY ALWAYS COMES FROM SESSION
   */

  if (
    resource === "conversations" &&
    c.has("created_by")
  ) {
    data.created_by = u.id;
  }

  /*
   * SENDER_ID ALWAYS COMES FROM SESSION
   */

  if (
    resource === "messages" &&
    c.has("sender_id")
  ) {
    data.sender_id = u.id;
  }

  /*
   * Never allow frontend to fake these
   */

  if (resource === "users") {
    delete data.id;
  }

  delete data.created_by_override;
  delete data.sender_id_override;

  const keys = (allowed[resource] || [])
    .filter(
      (key) =>
        c.has(key) &&
        data[key] !== undefined
    );

  /*
   * If DB has password_hash but allowed list does not
   */

  if (
    resource === "users" &&
    c.has("password_hash") &&
    data.password_hash !== undefined &&
    !keys.includes("password_hash")
  ) {
    keys.push("password_hash");
  }

  const id = uid();

  if (c.has("id")) {
    keys.unshift("id");
    data.id = id;
  }

  if (
    c.has("created_at") &&
    !keys.includes("created_at")
  ) {
    keys.push("created_at");
    data.created_at =
      new Date().toISOString();
  }

  if (!keys.length) {
    return json({
      error:
        "هیچ فیلد قابل ثبت نیست"
    }, 400);
  }

  const placeholders =
    keys.map(() => "?").join(",");

  try {
    await env.DB
      .prepare(`
        INSERT INTO ${table}
        (${keys.join(",")})
        VALUES(${placeholders})
      `)
      .bind(
        ...keys.map(
          (key) => data[key] ?? null
        )
      )
      .run();

    await log(
      env,
      u,
      "create",
      resource,
      id
    );

    return json({
      ok: true,
      id
    }, 201);
  } catch (e) {
    return json({
      error:
        e.message ||
        "ثبت انجام نشد"
    }, 400);
  }
}

/* =========================================================
   UPDATE RESOURCE
========================================================= */

async function update(
  env,
  u,
  resource,
  id,
  b
) {
  const cfg = RESOURCE[resource];

  if (!cfg) {
    return json({
      error: "منبع نامعتبر است"
    }, 400);
  }

  const table = cfg.table;
  const c = await cols(env, table);

  const data = {
    ...b
  };

  /*
   * Never allow changing these from frontend
   */

  delete data.id;
  delete data.created_by;
  delete data.sender_id;
  delete data.user_id;

  const keys = (allowed[resource] || [])
    .filter(
      (key) =>
        c.has(key) &&
        data[key] !== undefined
    );

  if (c.has("updated_at")) {
    keys.push("updated_at");
  }

  if (!keys.length) {
    return json({
      error:
        "داده‌ای برای ویرایش نیست"
    }, 400);
  }

  const set = keys
    .map((key) => `${key}=?`)
    .join(",");

  const values = keys.map(
    (key) =>
      key === "updated_at"
        ? new Date().toISOString()
        : data[key]
  );

  try {
    await env.DB
      .prepare(`
        UPDATE ${table}
        SET ${set}
        WHERE id=?
      `)
      .bind(
        ...values,
        id
      )
      .run();

    await log(
      env,
      u,
      "update",
      resource,
      id
    );

    return json({
      ok: true
    });
  } catch (e) {
    return json({
      error:
        e.message ||
        "ویرایش انجام نشد"
    }, 400);
  }
}

/* =========================================================
   MAIN API
========================================================= */

async function handle(req, env) {
  const url = new URL(req.url);

  const path = url.pathname
    .replace(/^\/api\/?/, "")
    .replace(/\/$/, "");

  const method = req.method;

  /* -------------------------------------------------------
     HEALTH
  ------------------------------------------------------- */

  if (path === "health") {
    return json({
      ok: true
    });
  }

  /* -------------------------------------------------------
     INITIAL ADMIN SETUP
  ------------------------------------------------------- */

  if (
    path === "auth/setup" &&
    method === "POST"
  ) {
    const countRow =
      await env.DB
        .prepare(
          "SELECT COUNT(*) n FROM users"
        )
        .first()
        .catch(() => null);

    if (!countRow) {
      return json({
        error:
          "جدول users وجود ندارد؛ ابتدا schema را اجرا کنید"
      }, 500);
    }

    if (Number(countRow.n) > 0) {
      return json({
        error:
          "راه‌اندازی اولیه قبلاً انجام شده است"
      }, 403);
    }

    const b = await body(req);

    if (!b.username || !b.password) {
      return json({
        error:
          "نام کاربری و رمز عبور الزامی است"
      }, 400);
    }

    if (String(b.password).length < 8) {
      return json({
        error:
          "رمز عبور باید حداقل ۸ کاراکتر باشد"
      }, 400);
    }

    const c = await cols(
      env,
      "users"
    );

    const id = uid();

    const fullName =
      [
        b.first_name,
        b.last_name
      ]
        .filter(Boolean)
        .join(" ")
        ||
      b.username;

    const fields = {
      id,
      username: b.username,
      full_name: fullName,
      email: b.email || null,
      role: "Super Admin",
      status: "Active",
      password_hash:
        await sha256(b.password),
      permissions: "[]",
      created_at:
        new Date().toISOString()
    };

    const keys = Object.keys(fields)
      .filter((key) => c.has(key));

    const placeholders =
      keys.map(() => "?").join(",");

    try {
      await env.DB
        .prepare(`
          INSERT INTO users
          (${keys.join(",")})
          VALUES(${placeholders})
        `)
        .bind(
          ...keys.map(
            (key) => fields[key]
          )
        )
        .run();

      return json({
        ok: true,
        id
      }, 201);
    } catch (e) {
      return json({
        error:
          e.message ||
          "راه‌اندازی انجام نشد"
      }, 400);
    }
  }

  /* -------------------------------------------------------
     LOGIN
  ------------------------------------------------------- */

  if (
    path === "auth/login" &&
    method === "POST"
  ) {
    try {
      const b = await body(req);

      if (!b.username || !b.password) {
        return json({
          error:
            "نام کاربری و رمز عبور الزامی است"
        }, 400);
      }

      const username =
        String(b.username).trim();

      const password =
        String(b.password);

      const u =
        await env.DB
          .prepare(`
            SELECT *
            FROM users
            WHERE username=?
            LIMIT 1
          `)
          .bind(username)
          .first();

      if (!u) {
        return json({
          error:
            "نام کاربری یا رمز عبور نادرست است"
        }, 401);
      }

      if (u.status !== "Active") {
        return json({
          error:
            "حساب کاربری غیرفعال است"
        }, 403);
      }

      const passwordHash =
        await sha256(password);

      if (
        passwordHash !==
        u.password_hash
      ) {
        return json({
          error:
            "نام کاربری یا رمز عبور نادرست است"
        }, 401);
      }

      if (
        !(await tableExists(
          env,
          "sessions"
        ))
      ) {
        return json({
          error:
            "جدول sessions در دیتابیس وجود ندارد"
        }, 500);
      }

      const sessionId = uid();
      const rawToken = uid() + uid();

      const tokenHash =
        await sha256(rawToken);

      const expiresAt =
        new Date(
          Date.now() +
          7 * 24 * 60 * 60 * 1000
        ).toISOString();

      await env.DB
        .prepare(`
          INSERT INTO sessions
          (
            id,
            user_id,
            token_hash,
            expires_at
          )
          VALUES(?,?,?,?)
        `)
        .bind(
          sessionId,
          u.id,
          tokenHash,
          expiresAt
        )
        .run();

      const ps =
        await permissions(
          env,
          u
        );

      const safeUser = {
        ...u,
        password_hash: undefined,
        permissions: ps
      };

      return json(
        {
          user: safeUser
        },
        200,
        {
          "set-cookie":
            `bp_session=${encodeURIComponent(rawToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
        }
      );
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return json({
        error:
          "خطا در ورود به سیستم"
      }, 500);
    }
  }

  /* -------------------------------------------------------
     AUTHENTICATED USER
  ------------------------------------------------------- */

  const u = await auth(
    req,
    env
  );

  /* -------------------------------------------------------
     ME
  ------------------------------------------------------- */

  if (path === "auth/me") {
    return u
      ? json({
          user: {
            ...u,
            password_hash: undefined,
            permissions:
              await permissions(
                env,
                u
              )
          }
        })
      : json({
          user: null
        }, 401);
  }

  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  if (path === "auth/logout") {
    const t = token(req);

    if (
      t &&
      await tableExists(
        env,
        "sessions"
      )
    ) {
      await env.DB
        .prepare(
          "DELETE FROM sessions WHERE token_hash=?"
        )
        .bind(
          await sha256(t)
        )
        .run();
    }

    return json(
      {
        ok: true
      },
      200,
      {
        "set-cookie":
          "bp_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
      }
    );
  }

  /* -------------------------------------------------------
     EVERYTHING BELOW REQUIRES AUTH
  ------------------------------------------------------- */

  if (!u) {
    return json({
      error:
        "احراز هویت لازم است"
    }, 401);
  }

  const ps =
    await permissions(
      env,
      u
    );

  /* =======================================================
     CHAT
  ======================================================= */

  if (
    path === "chat/contacts" &&
    method === "GET"
  ) {
    if (!can(u, ps, "chat")) {
      return json({
        error:
          "دسترسی غیرمجاز"
      }, 403);
    }

    return chatContacts(
      env,
      u,
      url
    );
  }

  if (
    path === "conversations" &&
    method === "GET"
  ) {
    if (!can(u, ps, "chat")) {
      return json({
        error:
          "دسترسی غیرمجاز"
      }, 403);
    }

    return listConversations(
      env,
      u
    );
  }

  if (
    path === "conversations" &&
    method === "POST"
  ) {
    if (!can(u, ps, "chat")) {
      return json({
        error:
          "دسترسی غیرمجاز"
      }, 403);
    }

    return createConversation(
      env,
      u,
      await body(req)
    );
  }

  const conversationMatch =
    path.match(
      /^conversations\/([^/]+)$/
    );

  if (
    conversationMatch &&
    method === "GET"
  ) {
    const conversationId =
      conversationMatch[1];

    await ensureChatTables(env);

    if (
      !(await isConversationMember(
        env,
        conversationId,
        u.id
      ))
    ) {
      return json({
        error:
          "دسترسی غیرمجاز"
      }, 403);
    }

    const conversation =
      await env.DB
        .prepare(`
          SELECT *
          FROM conversations
          WHERE id=?
          LIMIT 1
        `)
        .bind(conversationId)
        .first();

    if (!conversation) {
      return json({
        error:
          "گفتگو پیدا نشد"
      }, 404);
    }

    const members = (
      await env.DB
        .prepare(`
          SELECT
            u.id,
            u.full_name,
            u.username,
            u.role,
            u.status
          FROM conversation_members cm
          JOIN users u
            ON u.id=cm.user_id
          WHERE cm.conversation_id=?
        `)
        .bind(conversationId)
        .all()
    ).results;

    return json({
      conversation: {
        ...conversation,
        members
      }
    });
  }

  const messagesMatch =
    path.match(
      /^conversations\/([^/]+)\/messages$/
    );

  if (
    messagesMatch &&
    method === "GET"
  ) {
    return getMessages(
      env,
      u,
      messagesMatch[1]
    );
  }

  if (
    messagesMatch &&
    method === "POST"
  ) {
    return sendMessage(
      env,
      u,
      messagesMatch[1],
      await body(req)
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  if (path === "dashboard/stats") {
    return json({
      stats:
        await dashboard(env)
    });
  }

  /* =======================================================
     PERMISSIONS
  ======================================================= */

  if (path === "permissions") {
    if (
      !can(
        u,
        ps,
        "users.permissions"
      )
    ) {
      return json({
        error:
          "دسترسی غیرمجاز"
      }, 403);
    }

    try {
      return json({
        permissions:
          (
            await env.DB
              .prepare(
                "SELECT * FROM permissions ORDER BY key"
              )
              .all()
          ).results
      });
    } catch (e) {
      return json({
        error:
          e.message ||
          "خطا در دریافت دسترسی‌ها"
      }, 400);
    }
  }

  /* =======================================================
     MY REQUESTS
  ======================================================= */

  if (path === "requests/mine") {
    try {
      return json({
        items:
          (
            await env.DB
              .prepare(`
                SELECT *
                FROM requests
                WHERE user_id=?
                ORDER BY created_at DESC
              `)
              .bind(u.id)
              .all()
          ).results
      });
    } catch (e) {
      return json({
        error:
          e.message
      }, 400);
    }
  }

  /* =======================================================
     USER PERMISSIONS
  ======================================================= */

  if (
    path.startsWith("users/") &&
    path.endsWith("/permissions")
  ) {
    if (
      !can(
        u,
        ps,
        "users.permissions"
      )
    ) {
      return json({
        error:
          "دسترسی غیرمجاز"
      }, 403);
    }

    const id =
      path.split("/")[1];

    if (method === "GET") {
      try {
        return json({
          permissions:
            (
              await env.DB
                .prepare(`
                  SELECT
                    p.id,
                    p.key,
                    p.label,
                    COALESCE(
                      up.allowed,
                      CASE
                        WHEN rp.permission_id IS NOT NULL
                        THEN 1
                        ELSE 0
                      END
                    ) allowed
                  FROM permissions p
                  LEFT JOIN role_permissions rp
                    ON rp.permission_id=p.id
                    AND rp.role=(
                      SELECT role
                      FROM users
                      WHERE id=?
                    )
                  LEFT JOIN user_permissions up
                    ON up.permission_id=p.id
                    AND up.user_id=?
                  ORDER BY p.key
                `)
                .bind(
                  id,
                  id
                )
                .all()
            ).results
        });
      } catch {
        return json({
          permissions: []
        });
      }
    }

    if (method === "POST") {
      const b = await body(req);

      try {
        await env.DB
          .prepare(
            "DELETE FROM user_permissions WHERE user_id=?"
          )
          .bind(id)
          .run();

        for (
          const x of b.permissions || []
        ) {
          await env.DB
            .prepare(`
              INSERT INTO user_permissions
              (
                user_id,
                permission_id,
                allowed
              )
              VALUES(?,?,?)
            `)
            .bind(
              id,
              x.id,
              x.allowed ? 1 : 0
            )
            .run();
        }

        return json({
          ok: true
        });
      } catch (e) {
        return json({
          error:
            e.message
        }, 400);
      }
    }
  }

  /* =======================================================
     CLIENT COMMUNICATIONS
  ======================================================= */

  if (
    path.startsWith(
      "client-communications/"
    )
  ) {
    const clientId =
      path.split("/")[1];

    if (method === "GET") {
      try {
        return json({
          items:
            (
              await env.DB
                .prepare(`
                  SELECT *
                  FROM client_communications
                  WHERE client_id=?
                  ORDER BY communication_date DESC
                `)
                .bind(clientId)
                .all()
            ).results
        });
      } catch (e) {
        return json({
          error:
            e.message
        }, 400);
      }
    }

    if (method === "POST") {
      const b = await body(req);

      try {
        await env.DB
          .prepare(`
            INSERT INTO client_communications
            (
              id,
              client_id,
              type,
              subject,
              content,
              created_by
            )
            VALUES(?,?,?,?,?,?)
          `)
          .bind(
            uid(),
            clientId,
            b.type || "note",
            b.subject || "",
            b.content || "",
            u.id
          )
          .run();

        return json({
          ok: true
        }, 201);
      } catch (e) {
        return json({
          error:
            e.message
        }, 400);
      }
    }
  }

  /* =======================================================
     GENERIC RESOURCES
  ======================================================= */

  const [resource, id] =
    path.split("/");

  if (RESOURCE[resource]) {
    const cfg =
      RESOURCE[resource];

    const need =
      cfg.perm;

    /*
     * GET LIST
     */

    if (
      method === "GET" &&
      !id
    ) {
      let sql =
        `SELECT * FROM ${cfg.table}`;

      const params = [];

      const q =
        url.searchParams.get("q");

      const c =
        await cols(
          env,
          cfg.table
        );

      if (
        q &&
        cfg.search &&
        c.has(cfg.search)
      ) {
        sql +=
          ` WHERE ${cfg.search} LIKE ?`;

        params.push(
          `%${q}%`
        );
      }

      if (c.has("created_at")) {
        sql +=
          " ORDER BY created_at DESC";
      }

      sql += " LIMIT 500";

      try {
        return json({
          items:
            (
              await env.DB
                .prepare(sql)
                .bind(...params)
                .all()
            ).results
        });
      } catch (e) {
        return json({
          error:
            e.message
        }, 400);
      }
    }

    /*
     * GET SINGLE
     */

    if (
      method === "GET" &&
      id
    ) {
      try {
        const item =
          await env.DB
            .prepare(`
              SELECT *
              FROM ${cfg.table}
              WHERE id=?
            `)
            .bind(id)
            .first();

        return item
          ? json({ item })
          : json({
              error:
                "یافت نشد"
            }, 404);
      } catch (e) {
        return json({
          error:
            e.message
        }, 400);
      }
    }

    /*
     * CREATE
     */

    if (method === "POST") {
      if (
        !can(
          u,
          ps,
          need
        )
      ) {
        return json({
          error:
            "دسترسی غیرمجاز"
        }, 403);
      }

      return create(
        env,
        u,
        resource,
        await body(req)
      );
    }

    /*
     * UPDATE
     */

    if (
      method === "PUT" &&
      id
    ) {
      if (
        !can(
          u,
          ps,
          need
        )
      ) {
        return json({
          error:
            "دسترسی غیرمجاز"
        }, 403);
      }

      return update(
        env,
        u,
        resource,
        id,
        await body(req)
      );
    }

    /*
     * DELETE
     */

    if (
      method === "DELETE" &&
      id
    ) {
      if (
        !can(
          u,
          ps,
          need
        )
      ) {
        return json({
          error:
            "دسترسی غیرمجاز"
        }, 403);
      }

      try {
        await env.DB
          .prepare(`
            DELETE FROM ${cfg.table}
            WHERE id=?
          `)
          .bind(id)
          .run();

        await log(
          env,
          u,
          "delete",
          resource,
          id
        );

        return json({
          ok: true
        });
      } catch (e) {
        return json({
          error:
            e.message
        }, 400);
      }
    }
  }

  /* =======================================================
     REPORTS
  ======================================================= */

  if (path === "reports/summary") {
    return json({
      stats:
        await dashboard(env)
    });
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  return json({
    error:
      "مسیر پیدا نشد"
  }, 404);
}

/* =========================================================
   CLOUDFLARE WORKER
========================================================= */

export default {
  async fetch(req, env) {
    try {
      const url =
        new URL(req.url);

      if (
        url.pathname.startsWith(
          "/api/"
        )
      ) {
        return handle(
          req,
          env
        );
      }

      const asset =
        await env.ASSETS.fetch(req);

      return asset.status === 404
        ? env.ASSETS.fetch(
            new Request(
              new URL(
                "/index.html",
                req.url
              ),
              req
            )
          )
        : asset;
    } catch (e) {
      console.error(
        "WORKER ERROR:",
        e
      );

      return json({
        error:
          e.message ||
          "خطای سرور"
      }, 500);
    }
  }
};