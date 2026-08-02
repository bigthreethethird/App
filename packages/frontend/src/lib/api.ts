export interface Product {
  id: string;
  brandId: string;
  name: string;
  sku?: string | null;
  nfcId: string;
  description?: string | null;
  strain?: string | null;
  strainType?: string | null;
  genetics?: string | null;
  effects?: string | null;
  flavors?: string | null;
  grower?: string | null;
  cultivationMethod?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  cannabinoidProfile?: { thc?: number | null; cbd?: number | null; cbg?: number | null } | null;
  terpeneProfile?: { data: string } | null;
  media?: { id: string; url: string; type: string; altText?: string | null }[];
  coa?: { url: string; labName?: string | null; testDate?: string | null; status: string } | null;
}
export interface Brand { id: string; name: string; email?: string | null; clerkId?: string | null }
export interface Analytics { totalScans: number; uniqueVisitors: number; productsLive: number; verificationRate: number }
export interface SubscriptionInfo { status: string; plan?: string | null; currentPeriodEnd?: string | null; cancelAtPeriodEnd?: boolean }
export interface UploadResult { url: string | null; key: string | null; error?: string }

const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const api = {
  products: () => request<Product[]>('/api/admin/products'),
  product: (id: string) => request<Product>(`/api/admin/products/${id}`),
  createProduct: (data: Partial<Product>) => request<Product>('/api/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>) => request<Product>(`/api/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  analytics: () => request<Analytics>('/api/admin/analytics'),
  brand: () => request<Brand>('/api/admin/brand'),
  billing: {
    createCheckout: (priceId: string, successUrl: string, cancelUrl: string) =>
      request<{ url: string | null; error?: string }>('/api/admin/billing/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId, successUrl, cancelUrl }),
      }),
    portal: () => request<{ url: string | null; error?: string }>('/api/admin/billing/portal'),
    subscription: () => request<SubscriptionInfo>('/api/admin/billing/subscription'),
  },
  upload: async (file: File): Promise<UploadResult> => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${base}/api/admin/upload`, { method: 'POST', body: fd });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  deleteUpload: (key: string) =>
    request<{ success: boolean; error?: string }>(`/api/admin/upload?key=${encodeURIComponent(key)}`, { method: 'DELETE' }),
  chat: (nfcId: string, message: string, history: { role: 'user' | 'assistant'; content: string }[]) =>
    request<{ reply: string }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ nfcId, message, history: history.slice(-10) }),
    }),
};
