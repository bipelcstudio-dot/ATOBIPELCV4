export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const contentType = res.headers.get("content-type") || "";
  let data = {};
  let parseFailed = false;
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => { parseFailed = true; return {}; });
  } else {
    parseFailed = true;
  }

  // اگر پاسخ JSON نبود (مثلاً به‌جای Worker به‌اشتباه به Vite خورده)،
  // دیگه به‌عنوان موفقیت درنظر گرفته نشه — قبلاً این حالت بی‌صدا success می‌شد.
  if (!res.ok || data.success === false || (parseFailed && !res.ok)) {
    const err = new Error(data.error || "خطایی رخ داد.");
    err.status = res.status;
    throw err;
  }
  if (parseFailed) {
    const err = new Error("پاسخ نامعتبر از سرور دریافت شد. مطمئن شوید Worker (بک‌اند) در حال اجراست.");
    err.status = res.status;
    throw err;
  }
  return data;
}
