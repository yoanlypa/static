// src/services/api.js
import axios from "axios";

// Base URL robusta: VITE_API_URL sin barra final + "/api"
// Ejemplos:
//   VITE_API_URL = http://localhost:8000  → baseURL = http://localhost:8000/api
//   VITE_API_URL = https://tudominio.com → baseURL = https://tudominio.com/api
const API_ROOT = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  withCredentials: true, // si usas cookies; si no, puedes dejarlo en true igualmente
});

// ---- Autorización con Bearer ----
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// ---- Refresh automático del token ----
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}
function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config: originalRequest } = error;
    if (!response) return Promise.reject(error);

    // Si es 401 y NO es el endpoint de refresh → intentamos refrescar
    const is401 = response.status === 401;
    const isRefreshCall = originalRequest.url?.includes("token/refresh/");
    if (is401 && !isRefreshCall) {
      if (isRefreshing) {
        // En cola hasta que termine el refresh en curso
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) throw new Error("No refresh token");

        // MUY IMPORTANTE: usamos la misma baseURL → /api/token/refresh/
        const { data } = await api.post("token/refresh/", { refresh });

        localStorage.setItem("access", data.access);
        onRefreshed(data.access);

        // Reintentar la petición original con el nuevo access
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshErr) {
        // limpiar sesión y enviar a login
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const opsApi = {
   listOpsOrders: (params) => api.get("ops/pedidos/", { params }),
   markDelivered: (id) => api.post(`ops/pedidos/${id}/delivered/`),
   markCollected: (id) => api.post(`ops/pedidos/${id}/collected/`),
 };

export const meApi = {
   getMe: () => api.get("me/"),
 };

export default api;
export { API_ROOT };
