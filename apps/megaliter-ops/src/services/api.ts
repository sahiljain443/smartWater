import { useAuthStore } from "../store/auth";

const BASE_URL = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request<any>("/auth/me"),

  // Sites
  getSites: () => request<{ sites: any[] }>("/ops/sites"),
  getSite: (siteId: string) => request<{ site: any }>(`/ops/sites/${siteId}`),
  getSiteKPIs: (siteId: string) =>
    request<{ siteId: string; period: string; metrics: any[] }>(`/ops/sites/${siteId}/kpis`),

  // Sensors
  getLiveSensors: (siteId: string) =>
    request<{ siteId: string; sensors: any[] }>(`/ops/sites/${siteId}/sensors/live`),
  getLatestSensors: (siteId: string) =>
    request<{ siteId: string; sensors: any[] }>(`/ops/sites/${siteId}/sensors/latest`),
  getSensorHistory: (siteId: string, sensorId: string, params?: { from?: string; to?: string; bucket?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ data: any[] }>(`/ops/sites/${siteId}/sensors/${sensorId}/history?${qs}`);
  },

  // Alerts
  getAlerts: (siteId: string) =>
    request<{ alerts: any[] }>(`/ops/sites/${siteId}/alerts`),

  // Assets
  getAssets: (siteId: string) =>
    request<{ assets: any[] }>(`/ops/sites/${siteId}/assets`),

  // Work Orders
  getWorkOrders: (siteId: string) =>
    request<{ workOrders: any[] }>(`/ops/sites/${siteId}/work-orders`),
  createWorkOrder: (siteId: string, data: any) =>
    request<{ workOrder: any }>(`/ops/sites/${siteId}/work-orders`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Logbook
  getLogbook: (siteId: string) =>
    request<{ entries: any[] }>(`/ops/sites/${siteId}/logbook`),
  createLogEntry: (siteId: string, data: any) =>
    request<{ entry: any }>(`/ops/sites/${siteId}/logbook`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Admin
  getUsers: () => request<{ users: any[] }>("/admin/users"),
  createSite: (data: any) =>
    request<{ site: any }>("/admin/sites", { method: "POST", body: JSON.stringify(data) }),
};
