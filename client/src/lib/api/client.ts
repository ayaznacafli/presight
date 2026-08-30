/** Same-origin by default: Vite proxies `/api` in dev, nginx does in the image. */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code = 'UNKNOWN', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Retrying a 4xx with the same input will fail the same way. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500 || this.status === 429;
  }
}

export type QueryValue = string | number | boolean | readonly string[] | undefined | null;

export function buildQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function apiGet<T>(
  path: string,
  params: Record<string, QueryValue> = {},
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQueryString(params)}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    // Network-level failure: no status to report, but it is worth retrying.
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string; code?: string; details?: unknown } }
      | null;
    throw new ApiError(
      body?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body?.error?.code,
      body?.error?.details,
    );
  }

  return (await response.json()) as T;
}
