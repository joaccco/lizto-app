import { z } from 'zod';
import { getApiUrl } from '@/config/env';
import { getToken, removeToken } from '@/core/security/secureStore';

export class ApiContractError extends Error {
  constructor(public zodError: z.ZodError, public endpoint: string) {
    super(`CONTRACT_ERROR: La respuesta del endpoint [${endpoint}] no cumple con el esquema esperado.`);
    this.name = 'ApiContractError';
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
    this.name = 'HttpError';
  }
}

type OnUnauthorizedListener = () => void;
const unauthorizedListeners: Set<OnUnauthorizedListener> = new Set();

export const subscribeOnUnauthorized = (listener: OnUnauthorizedListener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

const notifyUnauthorized = () => {
  unauthorizedListeners.forEach((listener) => listener());
};

export interface HttpRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function httpClient<T>(
  endpoint: string,
  schema: z.ZodType<T, any, any>,
  options: HttpRequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers: defaultHeaders,
  });

  if (response.status === 401) {
    await removeToken();
    notifyUnauthorized();
    throw new HttpError(401, 'Unauthenticated');
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = json?.message || `HTTP Error ${response.status}`;
    throw new HttpError(response.status, errorMessage, json);
  }

  const parseResult = schema.safeParse(json);
  if (!parseResult.success) {
    throw new ApiContractError(parseResult.error, endpoint);
  }

  return parseResult.data;
}

httpClient.get = <T>(endpoint: string, schema: z.ZodType<T, any, any>, options: HttpRequestOptions = {}) =>
  httpClient<T>(endpoint, schema, { ...options, method: 'GET' });

httpClient.post = <T>(endpoint: string, schema: z.ZodType<T, any, any>, body?: any, options: HttpRequestOptions = {}) =>
  httpClient<T>(endpoint, schema, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined });
