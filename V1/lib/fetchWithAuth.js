// Helper to call internal APIs with Supabase access token
// Usage (client components):
// const { data: { session } } = await supabase.auth.getSession();
// const res = await fetchWithAuth('/api/roles', { method: 'POST', body: JSON.stringify(...) }, supabase, session);

export async function fetchWithAuth(url, options = {}, supabase, session) {
  const { data: sessionData } = session ? { data: { session } } : await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!headers.has('Content-Type') && options.body && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
}
