import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user } = useAuth();
  const [convs, setConvs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [title, setTitle] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadConversations() {
    try {
      const d = await api("/conversations");
      setConvs(d.conversations || []);
    } catch (e) {
      setError(e.message || "خطا در دریافت گفتگوها");
    }
  }

  async function loadContacts() {
    try {
      const d = await api(`/chat/contacts?q=${encodeURIComponent(contactQuery)}`);
      setContacts(d.users || []);
    } catch (e) {
      setError(e.message || "خطا در دریافت مخاطبین");
    }
  }

  async function loadMessages(id = active) {
    if (!id) return;
    try {
      const d = await api(`/conversations/${id}/messages`);
      setMessages(d.messages || []);
    } catch (e) {
      setError(e.message || "خطا در دریافت پیام‌ها");
    }
  }

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { loadContacts(); }, [contactQuery]);
  useEffect(() => {
    if (!active) return;
    loadMessages(active);
    const timer = setInterval(() => loadMessages(active), 5000);
    return () => clearInterval(timer);
  }, [active]);

  const activeConversation = useMemo(
    () => convs.find((c) => c.id === active) || null,
    [convs, active]
  );

  async function openPrivate(userId) {
    setError("");
    setBusy(true);
    try {
      const d = await api("/conversations", {
        method: "POST",
        body: JSON.stringify({ type: "private", user_ids: [userId] }),
      });
      await loadConversations();
      setActive(d.id);
    } catch (e) {
      setError(e.message || "ساخت گفتگوی خصوصی انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function createGroup(e) {
    e?.preventDefault();
    if (!title.trim() || selectedUsers.length === 0) return;
    setError("");
    setBusy(true);
    try {
      const d = await api("/conversations", {
        method: "POST",
        body: JSON.stringify({
          type: "group",
          title: title.trim(),
          user_ids: selectedUsers,
        }),
      });
      setTitle("");
      setSelectedUsers([]);
      setGroupOpen(false);
      await loadConversations();
      setActive(d.id);
    } catch (e) {
      setError(e.message || "ساخت گروه انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !active || busy) return;
    setError("");
    setBusy(true);
    try {
      await api(`/conversations/${active}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: text.trim() }),
      });
      setText("");
      await loadMessages(active);
      await loadConversations();
    } catch (e) {
      setError(e.message || "ارسال پیام انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  function toggleMember(id) {
    setSelectedUsers((items) =>
      items.includes(id) ? items.filter((x) => x !== id) : [...items, id]
    );
  }

  return (
    <section>
      <div className="page-head">
        <div><small>ارتباط داخلی تیم</small><h1>چت سازمانی</h1></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="primary" onClick={() => setGroupOpen(true)}>گروه جدید</button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="chat">
        <aside>
          <div style={{ padding: 10 }}>
            <input
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder="جستجوی مخاطب..."
            />
          </div>

          <div className="chat-section-title">مخاطبین</div>
          {contacts.map((contact) => (
            <button
              key={contact.id}
              disabled={busy || contact.id === user?.id}
              onClick={() => openPrivate(contact.id)}
            >
              <b>{contact.full_name || contact.username || "کاربر"}</b>
              <small>{contact.role || contact.position || ""}</small>
            </button>
          ))}

          <div className="chat-section-title">گفتگوها</div>
          {convs.map((c) => (
            <button
              key={c.id}
              className={active === c.id ? "selected" : ""}
              onClick={() => setActive(c.id)}
            >
              <b>{c.display_name || c.title || "گفتگو"}</b>
              <small>{c.last_message || "هنوز پیامی نیست"}</small>
            </button>
          ))}
        </aside>

        <div className="chat-main">
          {active ? (
            <>
              <div className="chat-head">
                <b>{activeConversation?.display_name || activeConversation?.title || "گفتگو"}</b>
              </div>
              <div className="messages">
                {messages.length ? messages.map((m) => (
                  <div className={`message ${m.sender_id === user?.id ? "mine" : ""}`} key={m.id}>
                    <b>{m.sender_name || "کاربر"}</b>
                    <p>{m.message}</p>
                    <small>{new Date(m.created_at).toLocaleString("fa-IR")}</small>
                  </div>
                )) : <div className="empty">هنوز پیامی در این گفتگو نیست.</div>}
              </div>
              <form className="chat-input" onSubmit={send}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="پیام بنویس..."
                  disabled={busy}
                />
                <button className="primary" disabled={busy || !text.trim()}>ارسال</button>
              </form>
            </>
          ) : (
            <div className="empty">از بخش مخاطبین یک نفر را انتخاب کن یا یک گروه بساز.</div>
          )}
        </div>
      </div>

      {groupOpen && (
        <div className="modal">
          <form className="modal-card" onSubmit={createGroup}>
            <div className="modal-head"><h2>گفتگوی گروهی جدید</h2><button type="button" onClick={() => setGroupOpen(false)}>×</button></div>
            <label>نام گروه<input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="مثلاً تیم تولید" /></label>
            <label>اعضا</label>
            <div className="selector-list">
              {contacts.map((contact) => (
                <label key={contact.id} className="selector-option">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(contact.id)}
                    onChange={() => toggleMember(contact.id)}
                  />
                  <span>{contact.full_name || contact.username}</span>
                </label>
              ))}
            </div>
            <button className="primary" type="submit" disabled={busy || !title.trim() || !selectedUsers.length}>ساخت گروه</button>
          </form>
        </div>
      )}
    </section>
  );
}
