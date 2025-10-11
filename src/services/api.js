// src/services/api.js
import axios from "axios";

// Soporta VITE_API_URL (principal) o VITE_API_ROOT (fallback)
const ENV_API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_ROOT || "";
const API_ROOT = ENV_API.replace(/\/$/, ""); // sin barra final

const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  withCredentials: true,
});

// ---------- Helpers de normalización ----------
function stripToDate(v) {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (s.includes("T")) return s.split("T", 1)[0];
  if (s.includes(" ")) return s.split(" ", 1)[0];
  return s;
}

function coerceIntOrDelete(obj, key) {
  if (!(key in obj)) return;
  const raw = obj[key];
  if (raw === "" || raw === null || raw === undefined) {
    delete obj[key];
    return;
  }
  const n = Number(raw);
  if (Number.isNaN(n)) {
    delete obj[key];
  } else {
    obj[key] = n;
  }
}

function injectHoraIntoNotas(notas, hora) {
  // elimina tags previos y añade uno nuevo limpio
  const clean = String(notas || "")
    .replace(/(^|\n)HORA_INICIO:\s*\d{1,2}:\d{2}\s*/gi, "")
    .trim();
  const tag = `HORA_INICIO: ${hora}`;
  return [clean, tag].filter(Boolean).join("\n");
}

// ---------- Autorización ----------
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }

  // Normalización previa a enviar datos
  const method = (config.method || "get").toLowerCase();
  if (["post", "put", "patch"].includes(method) && config.data && typeof config.data === "object") {
    const d = config.data;

    // Fechas: enviar solo YYYY-MM-DD
    if (d.fecha_inicio) d.fecha_inicio = stripToDate(d.fecha_inicio);
    if (d.fecha_fin) d.fecha_fin = stripToDate(d.fecha_fin);

    // Tipo de servicio: mapear dia_completo -> dia_Completo (modelo)
    if (d.tipo_servicio === "dia_completo") d.tipo_servicio = "dia_Completo";

    // Mediodía: si viene hora_mediodia, guardarla "aparte" dentro de notas con tag
    if (d.tipo_servicio === "mediodia" && typeof d.hora_mediodia === "string" && d.hora_mediodia.trim()) {
      d.notas = injectHoraIntoNotas(d.notas, d.hora_mediodia.trim());
    }
    // nunca enviar el campo UI
    if ("hora_mediodia" in d) delete d.hora_mediodia;

    // emisores numérico u omitir
    coerceIntOrDelete(d, "empresa");
    coerceIntOrDelete(d, "emisores");
  }

  return config;
});

// ---------- Refresh de token 401 ----------
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

    const is401 = response.status === 401;
    const isRefreshCall = originalRequest?.url?.includes("token/refresh/");

    if (is401 && !isRefreshCall) {
      if (isRefreshing) {
        // Espera a que termine el refresh actual
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
        const { data } = await api.post("token/refresh/", { refresh });

        localStorage.setItem("access", data.access);
        onRefreshed(data.access);

        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshErr) {
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

// ---------- Endpoints ----------
export const opsApi = {
  listOpsOrders: (params) => api.get("ops/pedidos/", { params }),
  markDelivered: (id, payload) => api.post(`ops/pedidos/${id}/delivered/`, payload),
  markCollected: (id) => api.post(`ops/pedidos/${id}/collected/`),
  createOrder: (payload) => api.post("ops/pedidos/", payload),
  postCruiseBulk: (rows) => api.post("pedidos/cruceros/bulk/", rows),
};
export const remindersApi = {
  list: (params) => api.get("reminders/", { params }),
  create: ({ title, when, notes }) => api.post("reminders/", {title, due_at: when, notes,}),  
  update: (id, payload) => api.patch(`reminders/${id}/`, payload),
  remove: (id) => api.delete(`reminders/${id}/`),
};

export const meApi = {
  getMe: () => api.get("me/"),
};
export const companiesApi = {
  list: () => api.get("empresas/"),
};
export default api;
export { API_ROOT };
