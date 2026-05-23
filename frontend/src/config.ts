// Centralized API configuration for flexibility across local, Docker, and production deployments.
export const API_BASE_URL = 
  (import.meta.env.VITE_API_URL as string) || 
  (import.meta.env.DEV ? "http://localhost:8000" : window.location.origin);
