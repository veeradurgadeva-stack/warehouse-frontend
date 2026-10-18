const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "Request failed");
    throw new Error(message || `HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  base: API_BASE,
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  products: {
    list: () => request("/products"), create: (x) => request("/products", { method: "POST", body: JSON.stringify(x) }),
    update: (id, x) => request(`/products/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(x) }),
    remove: (id) => request(`/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  suppliers: {
    list: () => request("/suppliers"), create: (x) => request("/suppliers", { method: "POST", body: JSON.stringify(x) }),
    update: (id, x) => request(`/suppliers/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(x) }),
    remove: (id) => request(`/suppliers/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  inventory: { list: () => request("/inventory"), update: (id, x) => request(`/inventory/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(x) }) },
  receiving: { list: () => request("/receiving"), create: (x) => request("/receiving", { method: "POST", body: JSON.stringify(x) }) },
  orders: { list: () => request("/orders"), update: (id, x) => request(`/orders/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(x) }) },
  locations: {
    list: () => request("/warehouses/locations"), create: (x) => request("/warehouses/locations", { method: "POST", body: JSON.stringify(x) }),
    update: (id, x) => request(`/warehouses/locations/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(x) }),
    remove: (id) => request(`/warehouses/locations/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  users: {
    list: () => request("/users"), create: (x) => request("/users", { method: "POST", body: JSON.stringify(x) }),
    update: (id, x) => request(`/users/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(x) }),
    remove: (id) => request(`/users/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  reports: () => request("/reports"),
};
