/**
 * Get API Base URL for backend requests.
 * In local development, defaults to relative '' (leveraging Vite proxy to localhost:4000).
 * In production (Vercel deployment), reads from VITE_API_URL environment variable.
 */
export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL || '';
  // Ensure no trailing slash
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
