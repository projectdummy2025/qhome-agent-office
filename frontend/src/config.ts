// Proxy (vite.config.ts) handles /api routing in dev and preview.
// In Docker production, Nginx proxies /api to backend.
// Use VITE_API_URL only when backend is on a different domain entirely.
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || '';
