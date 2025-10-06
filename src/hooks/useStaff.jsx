// src/hooks/useStaff.jsx
import { useQuery } from "@tanstack/react-query";
import { meApi } from "../services/api";
import { useAuth } from "./useAuth";

export function useStaff() {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const { data } = await meApi.getMe();
        return data;
      } catch (err) {
        // Si no hay sesión, devolvemos null y NO reventamos la UI
        if (err?.response?.status === 401) return null;
        throw err;
      }
    },
    enabled: isAuthenticated,        // <— clave: solo consulta si estás autenticado
    staleTime: 60_000,
  });

  const me = query.data;

  return {
    isLoading: isAuthenticated ? query.isLoading : false,
    isError: isAuthenticated ? query.isError : false,
    isStaff: Boolean(me?.is_staff),
    me,
  };
}
