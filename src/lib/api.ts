// Client-side fetch helper - uses relative URLs (same-origin API routes)
export const api = (path: string, opts: RequestInit = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };

  return fetch(path, { ...opts, headers }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return Promise.reject(data);
    }
    return data;
  });
};
