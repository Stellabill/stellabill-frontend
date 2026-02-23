import { Subscription } from '@/types/subscription'

const API_BASE = '/api'

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}

export const subscriptions = {
  list: () => api<{ subscriptions: Subscription[] }>('/subscriptions'),
  get: (id: string) => api<Subscription>(`/subscriptions/${id}`),
}

export const plans = {
  list: () => api<{ plans: unknown[] }>('/plans'),
}
