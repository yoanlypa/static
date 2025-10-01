 const API_ROOT = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
 // Si pones VITE_API_URL="https://tudominio.com", añadimos /api aquí:
 const api = axios.create({
   baseURL: `${API_ROOT}/api`,
   withCredentials: true,
 });

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

 api.interceptors.request.use((config) => {
   const access = localStorage.getItem('access');
   if (access) {
     config.headers.Authorization = `Bearer ${access}`;
   }
   return config;
 });

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refresh = localStorage.getItem('refresh');
        const { data } = await api.post('token/refresh/', { refresh });
        localStorage.setItem('access', data.access);
        onRefreshed(data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
