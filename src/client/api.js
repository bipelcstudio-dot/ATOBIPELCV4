export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const err = new Error(data.error || "خطایی رخ داد.");
    err.status = res.status;
    throw err;
  }
  return data;
}
