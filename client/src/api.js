import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Helper examples (optional to use in components):
// export function login(email, password) { return api.post("/auth/login", { email, password }); }
// export function getMenu(cafeId) { return api.get(`/menu?cafeId=${cafeId}`); }
// export function createOrder(data) { return api.post("/orders", data); }
// export function createRequest(data) { return api.post("/requests", data); }
// export function getOrders() { return api.get("/orders"); }
// export function updateOrderStatus(id, status) { return api.put(`/orders/${id}/status`, { status }); }
// export function getRequests() { return api.get("/requests"); }
// export function updateRequestStatus(id, status) { return api.put(`/requests/${id}/status`, { status }); }
// export function createMenuItem(data) { return api.post("/menu", data); }
// export function updateMenuItem(id, data) { return api.put(`/menu/${id}`, data); }
// export function toggleAvailability(id, available) { return api.put(`/menu/${id}/availability`, { available }); }
// export function archiveItem(id) { return api.put(`/menu/${id}/archive`); }
