import {cloudApi, cloudEnabled} from './supabase';
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (cloudEnabled) return await cloudApi(path, options) as T;
  const response = await fetch(`/api${path}`, { credentials: 'same-origin', ...options, headers: { ...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed. Please try again.');
  return data;
}
