// src/hooks/useAuth.jsx
import { createContext, useContext, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

// Simple JWT decoder without external library
function jwtDecode(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Al montar, intentamos leer el access token y decodificarlo
  const [user, setUser] = useState(() => {
    const access = localStorage.getItem('access');
    return access ? jwtDecode(access) : null;
  });

  // 👇 React Query client (para refrescar "me" al hacer login/logout)
  const queryClient = useQueryClient();

  const login = async (email, password) => {
    try {
      // Pedimos tokens al backend
      const { data } = await api.post('token/', { email, password });

      // Guardamos tokens en localStorage
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);

      // Decodificamos el access para tener info básica (sub, exp, etc.)
      const decoded = jwtDecode(data.access);
      setUser(decoded);

      // 🔥 Punto clave:
      // invalidamos la query "me" para que Header vuelva a llamar /api/me/
      // ahora SÍ con Authorization: Bearer <access>
      await queryClient.invalidateQueries(['me']);

      return true;
    } catch (error) {
      if (error.response && error.response.data) {
        console.error('Login error:', error.response.data);
        throw new Error(error.response.data.detail || 'Credenciales incorrectas');
      } else {
        console.error('Unexpected login error:', error);
        throw new Error('Error inesperado al iniciar sesión');
      }
    }
  };

  const logout = async () => {
    // limpiamos tokens
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');

    // limpiamos nuestro estado local
    setUser(null);

    // invalidamos "me" para que Header deje de creer que hay sesión
    await queryClient.invalidateQueries(['me']);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
