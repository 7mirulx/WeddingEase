export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const API_BASE_URL = 'http://localhost:3000';

export async function apiFetch<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const { method = 'GET', body, headers = {} } = options;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${method} ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export type Product = {
  id: number;
  name: string;
  priceCents: number;
  createdAt: string;
};

export const ProductsApi = {
  list: () => apiFetch<Product[]>('/products'),
  create: (data: { name: string; priceCents: number }) =>
    apiFetch<Product>('/products', { method: 'POST', body: data }),
};


