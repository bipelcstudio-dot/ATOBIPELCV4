import fs from "node:fs";
import path from "node:path";

const file = path.resolve("src/index.js");
let s = fs.readFileSync(file, "utf8");

const marker = "  /*\n   * GENERIC RESOURCES\n   */";
if (!s.includes(marker)) throw new Error("Could not find GENERIC RESOURCES marker in src/index.js");
if (s.includes("INTERNAL CHAT ROUTES v2")) {
  console.log("Internal chat backend patch is already applied.");
  process.exit(0);
}

// Users can leave username empty in the UI. The DB schema currently has username NOT NULL,
// so generate a unique internal username when it is omitted.
const oldUserCheck = `    if(\n      c.has('username') &&\n      !b.username\n    ){\n      return json({\n        error:'نام کاربری الزامی است'\n      },400);\n    }`;
const newUserCheck = `    if(\n      c.has('username') &&\n      !b.username\n    ){\n      const base = String(b.full_name || 'user')\n        .trim()\n        .toLowerCase()\n        .replace(/[^a-z0-9_-]+/g,'-')\n        .replace(/^-+|-+$/g,'')\n        || 'user';\n      b.username = \`${'${base}'}-${'${uid().slice(0,8)}'}\`;\n      if(!keys.includes('username')) keys.push('username');\n    }`;
if (!s.includes(oldUserCheck)) throw new Error("Could not find users username validation block");
s = s.replace(oldUserCheck, newUserCheck);

const routes = String.raw`  /* INTERNAL CHAT ROUTES v2 */
  if(path==='chat/contacts'){
    const q=String(url.searchParams.get('q')||'').trim();
    if(!can(u,ps,'chat') && !can(u,ps,'chat.access')){
      return json({error:'دسترسی غیرمجاز'},403);
    }
    try{
      let sql=`SELECT id,username,full_name,role,position,department,status FROM users WHERE id!=?`;
      const params=[u.id];
      if(q){
        sql += ` AND (full_name LIKE ? OR username LIKE ? OR position LIKE ? OR department LIKE ?)`;
        const x='%'+q+'%';
        params.push(x,x,x,x);
      }
      sql += ` ORDER BY CASE WHEN status='Active' THEN 0 ELSE 1 END, full_name LIMIT 200`;
      const rows=(await env.DB.prepare(sql).bind(...params).all()).results;
      return json({users:rows});
    }catch(e){
      return json({error:e.message||'خطا در دریافت مخاطبین'},400);
    }
  }

  if(path==='conversations' && method==='GET'){
    if(!can(u,ps,'chat') && !can(u,ps,'chat.access')) return json({error:'دسترسی غیرمجاز'},403);
    try{
      if(!(await tableExists(env,'conversation_members'))){
        return json({error:'جدول conversation_members وجود ندارد؛ migration چت را اجرا کنید.'},500);
      }
      const rows=(await env.DB.prepare(`
        SELECT c.id,c.type,c.title,c.project_id,c.created_by,c.created_at,
          CASE WHEN c.type='private' THEN COALESCE(
            (SELECT u2.full_name FROM conversation_members cm2 JOIN users u2 ON u2.id=cm2.user_id
             WHERE cm2.conversation_id=c.id AND cm2.user_id!=? LIMIT 1), c.title, 'گفتگو')
          ELSE COALESCE(c.title,'گفتگوی گروهی') END AS display_name,
          (SELECT m.message FROM messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
          (SELECT m.created_at FROM messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
        FROM conversations c
        JOIN conversation_members cm ON cm.conversation_id=c.id AND cm.user_id=?
        ORDER BY COALESCE(last_message_at,c.created_at) DESC
        LIMIT 200
      `).bind(u.id,u.id).all()).results;
      return json({conversations:rows});
    }catch(e){
      return json({error:e.message||'خطا در دریافت گفتگوها'},400);
    }
  }

  if(path==='conversations' && method==='POST'){
    if(!can(u,ps,'chat') && !can(u,ps,'chat.access')) return json({error:'دسترسی غیرمجاز'},403);
    const b=await body(req);
    const type=b.type==='group' ? 'group' : 'private';
    const ids=[...new Set((Array.isArray(b.user_ids)?b.user_ids:[]).filter(Boolean).map(String).filter(id=>id!==String(u.id)))];
    try{
      if(!(await tableExists(env,'conversation_members'))){
        return json({error:'جدول conversation_members وجود ندارد؛ migration چت را اجرا کنید.'},500);
      }
      if(type==='private'){
        if(ids.length!==1) return json({error:'برای چت خصوصی دقیقاً یک مخاطب انتخاب کنید.'},400);
        const target=await env.DB.prepare(`SELECT id,full_name,status FROM users WHERE id=?`).bind(ids[0]).first();
        if(!target) return json({error:'کاربر مقصد پیدا نشد.'},404);
        if(target.status==='Inactive') return json({error:'این کاربر غیرفعال است.'},400);
        const existing=await env.DB.prepare(`
          SELECT c.id
          FROM conversations c
          JOIN conversation_members cm ON cm.conversation_id=c.id
          WHERE c.type='private' AND cm.user_id IN (?,?)
          GROUP BY c.id
          HAVING COUNT(DISTINCT cm.user_id)=2
             AND (SELECT COUNT(*) FROM conversation_members x WHERE x.conversation_id=c.id)=2
          LIMIT 1
        `).bind(u.id,target.id).first();
        if(existing) return json({ok:true,id:existing.id,existing:true});
      }
      if(type==='group' && !String(b.title||'').trim()) return json({error:'نام گروه الزامی است.'},400);
      if(type==='group' && ids.length===0) return json({error:'حداقل یک عضو برای گروه انتخاب کنید.'},400);

      const idv=uid();
      await env.DB.prepare(`INSERT INTO conversations(id,type,title,project_id,created_by) VALUES(?,?,?,?,?)`)
        .bind(idv,type,type==='group'?String(b.title).trim():null,b.project_id||null,u.id).run();
      const members=[u.id,...ids];
      for(const memberId of [...new Set(members)]){
        const exists=await env.DB.prepare(`SELECT id FROM users WHERE id=? AND status='Active'`).bind(memberId).first();
        if(!exists) continue;
        await env.DB.prepare(`INSERT OR IGNORE INTO conversation_members(conversation_id,user_id) VALUES(?,?)`).bind(idv,memberId).run();
      }
      await log(env,u,'create','conversations',idv);
      return json({ok:true,id:idv},201);
    }catch(e){
      return json({error:e.message||'ساخت گفتگو انجام نشد'},400);
    }
  }

  if(path.startsWith('conversations/') && path.endsWith('/messages')){
    const parts=path.split('/');
    const conversationId=parts[1];
    if(!can(u,ps,'chat') && !can(u,ps,'chat.access')) return json({error:'دسترسی غیرمجاز'},403);
    try{
      if(!(await tableExists(env,'conversation_members'))){
        return json({error:'جدول conversation_members وجود ندارد؛ migration چت را اجرا کنید.'},500);
      }
      const member=await env.DB.prepare(`SELECT 1 AS ok FROM conversation_members WHERE conversation_id=? AND user_id=?`).bind(conversationId,u.id).first();
      if(!member) return json({error:'شما عضو این گفتگو نیستید.'},403);
      if(method==='GET'){
        const rows=(await env.DB.prepare(`
          SELECT m.id,m.conversation_id,m.sender_id,m.message,m.created_at,
                 COALESCE(u.full_name,u.username,'کاربر') sender_name
          FROM messages m
          LEFT JOIN users u ON u.id=m.sender_id
          WHERE m.conversation_id=?
          ORDER BY m.created_at ASC
          LIMIT 1000
        `).bind(conversationId).all()).results;
        return json({messages:rows});
      }
      if(method==='POST'){
        const b=await body(req);
        const message=String(b.message||'').trim();
        if(!message) return json({error:'متن پیام خالی است.'},400);
        if(message.length>10000) return json({error:'پیام بیش از حد طولانی است.'},400);
        const idv=uid();
        await env.DB.prepare(`INSERT INTO messages(id,conversation_id,sender_id,message,created_at) VALUES(?,?,?,?,?)`)
          .bind(idv,conversationId,u.id,message,new Date().toISOString()).run();
        return json({ok:true,id:idv},201);
      }
    }catch(e){
      return json({error:e.message||'خطا در ارتباط با پیام‌ها'},400);
    }
  }

`;
s = s.replace(marker, routes + marker);

fs.writeFileSync(file, s);
console.log("Updated src/index.js with internal chat routes and optional username support.");
