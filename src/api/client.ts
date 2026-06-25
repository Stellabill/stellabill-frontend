import { Subscription } from '@/types/subscription'

const API_BASE = '/api'

export interface ApiError extends Error {
  status?: number;
  technicalDetails?: string;
  isOffline?: boolean;
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  // Simulate network offline for demo if URL has ?simulate_offline
  if (typeof window !== 'undefined' && window.location.search.includes('simulate_offline')) {
    const error: ApiError = new Error('No internet connection');
    error.isOffline = true;
    throw error;
  }

  // Simulate API error for demo if URL has ?simulate_error
  if (typeof window !== 'undefined' && window.location.search.includes('simulate_error')) {
    const error: ApiError = new Error('Internal Server Error');
    error.status = 500;
    error.technicalDetails = 'Database connection timeout in the backend service. [Trace: 0x823fa1]';
    throw error;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    
    if (!res.ok) {
      const error: ApiError = new Error(`API error: ${res.statusText || res.status}`);
      error.status = res.status;
      try {
        const body = await res.json();
        error.technicalDetails = body.details || JSON.stringify(body);
      } catch {
        error.technicalDetails = 'No additional details provided by server.';
      }
      throw error;
    }
    
    return res.json() as Promise<T>
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'TypeError' && !navigator.onLine) {
      const error: ApiError = new Error('Network request failed (offline)');
      error.isOffline = true;
      throw error;
    }
    throw e;
  }
}

export const subscriptions = {
  list: () => api<{ subscriptions: Subscription[] }>('/subscriptions'),
  get: (id: string) => api<Subscription>(`/subscriptions/${id}`),
  pause: (id: string) => {
    // Simulating API call for development/demonstration
    return new Promise((resolve, reject) => {
      console.log(`Simulating pause for subscription: ${id}`);
      
      // Allow simulation of action failure via query param
      if (typeof window !== 'undefined' && window.location.search.includes('fail_action')) {
        setTimeout(() => {
          const error: ApiError = new Error('Action Failed');
          error.status = 400;
          error.technicalDetails = 'The subscription is already in the requested state or pending a transaction.';
          reject(error);
        }, 800);
        return;
      }

      setTimeout(() => resolve({ success: true }), 800);
    });
  },
  cancel: (id: string) => {
    // Simulating API call for development/demonstration
    return new Promise((resolve) => {
      console.log(`Simulating cancel for subscription: ${id}`);
      setTimeout(() => resolve({ success: true }), 1000);
    });
  },
}

export const plans = {
  list: () => api<{ plans: unknown[] }>('/plans'),
}
