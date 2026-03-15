import { AxiosError } from 'axios';

/**
 * Extract a user-friendly error message from an API error.
 * Works with Axios errors (which wrap the NestJS response)
 * and with generic Error objects.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Ocurrió un error'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    // NestJS validation errors return { message: string[] }
    if (Array.isArray(data?.message)) return data.message[0];
    // NestJS standard errors return { message: string }
    if (typeof data?.message === 'string') return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
