import { env } from '@/config/env';
import { ApiRequestError, type ApiErrorPayload } from '@/types/api';

interface RequestOptions {
  auth?: boolean;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  idempotencyKey?: string;
  skipAuthRefresh?: boolean;
}

interface AuthBridge {
  getAccessToken?: () => string | null;
  refreshAccessToken?: () => Promise<string | null>;
  clearAuth?: () => void | Promise<void>;
}

const authBridge: AuthBridge = {};

export function configureApiClient(bridge: AuthBridge): void {
  Object.assign(authBridge, bridge);
}

function resolveUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return `${env.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

async function parseBody<T>(response: Response): Promise<T | null> {
  if (response.status === 204) return null;
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function toError(response: Response, payload: ApiErrorPayload | null): ApiRequestError {
  const fallback =
    response.status === 401
      ? 'Sua sessão expirou. Entre novamente para continuar.'
      : response.status === 403
        ? 'Você não tem permissão para realizar esta ação.'
        : response.status === 404
          ? 'Registro não encontrado.'
          : response.status === 422
            ? 'Revise os dados informados e tente novamente.'
            : 'Não foi possível concluir a solicitação.';

  return new ApiRequestError(
    payload?.message?.trim() || fallback,
    response.status,
    payload?.error?.type,
    payload?.error?.details,
  );
}

async function request<T>(
  method: string,
  endpoint: string,
  options: RequestOptions = {},
  didRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };
  const shouldUseAuth = options.auth ?? true;
  const token = shouldUseAuth ? authBridge.getAccessToken?.() : null;

  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.idempotencyKey) headers['X-Idempotency-Key'] = options.idempotencyKey;

  const init: RequestInit = {
    method,
    headers,
    signal: options.signal,
  };

  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      init.body = options.body;
    } else {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(resolveUrl(endpoint), init);

  if (
    response.status === 401 &&
    shouldUseAuth &&
    !options.skipAuthRefresh &&
    !didRetry &&
    authBridge.refreshAccessToken
  ) {
    const nextToken = await authBridge.refreshAccessToken();

    if (nextToken) {
      return request<T>(method, endpoint, options, true);
    }

    await authBridge.clearAuth?.();
  }

  const payload = await parseBody<ApiErrorPayload | T>(response);

  if (!response.ok) {
    throw toError(response, payload as ApiErrorPayload | null);
  }

  return (payload as T) ?? (undefined as T);
}

export const apiClient = {
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'body'>) {
    return request<T>('GET', endpoint, options);
  },
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>('POST', endpoint, { ...options, body });
  },
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>('PUT', endpoint, { ...options, body });
  },
  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>('PATCH', endpoint, { ...options, body });
  },
  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'body'>) {
    return request<T>('DELETE', endpoint, options);
  },
};
