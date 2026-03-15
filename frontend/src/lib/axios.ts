import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
});

// ─── Request interceptor: attach access token ──────────────────────────────

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: silent refresh on 401 ───────────────────────────

// Refresh lock: prevents multiple simultaneous refresh attempts.
// When the first 401 triggers a refresh, subsequent 401s wait for the same
// refresh promise instead of firing their own.
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeToRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshComplete(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers.forEach((cb) => cb(''));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 errors, and not on the refresh endpoint itself
    // (to prevent infinite loops), and only once per request.
    const is401 = error.response?.status === 401;
    const isRefreshUrl = originalRequest?.url?.includes('/auth/refresh');
    const alreadyRetried = originalRequest?._retry;

    if (!is401 || isRefreshUrl || alreadyRetried || typeof window === 'undefined') {
      // If the refresh endpoint itself returned 401, the refresh token is expired.
      // Force logout.
      if (is401 && isRefreshUrl && typeof window !== 'undefined') {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Mark this request as retried so we don't loop
    originalRequest._retry = true;

    // If a refresh is already in progress, wait for it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeToRefresh((newToken: string) => {
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }

    // This is the first 401 — initiate the refresh
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      // No refresh token available — go to login
      isRefreshing = false;
      onRefreshFailed();
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Call the refresh endpoint directly with axios (not the `api` instance)
      // to avoid triggering our own interceptors recursively.
      const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
      const res = await axios.post(`${baseURL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken } = res.data;

      // Save the new tokens
      useAuthStore.getState().setTokens(access_token, newRefreshToken);

      // Notify all queued requests that the refresh succeeded
      isRefreshing = false;
      onRefreshComplete(access_token);

      // Retry the original request with the new access token
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch {
      // Refresh failed (token expired or invalid) — force logout
      isRefreshing = false;
      onRefreshFailed();
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }
  },
);
