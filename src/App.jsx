// src/App.jsx
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "./hooks/useAuth";

import Header from "./components/Header.jsx";
import Login from "./pages/Login";
import PedidosList from "./pages/PedidosList";
import Cruceros from "./pages/Cruceros";
import MisPedidos from "./pages/MisPedidos";
import Reminders from "./pages/Reminders";
import WorkerBoard from "./pages/WorkerBoard";
import StaffRoute from "./routes/StaffRoute";

import "./App.css";

// ✅ 1. Creamos el QueryClient UNA SOLA VEZ, fuera del componente
const queryClient = new QueryClient();

// ✅ 2. PrivateRoute se queda igual
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ✅ 3. Ahora AuthProvider está DENTRO de QueryClientProvider,
              así AuthProvider puede usar useQueryClient() sin error */}
      <AuthProvider>
        <Router>
          {/* Header tiene acceso tanto a Auth como a React Query */}
          <Header />

          <Routes>
            <Route path="/login" element={<Login />} />

            {/* OJO: tenías dos rutas "/" distintas.
               Dejamos una sola versión coherente. */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <PedidosList />
                </PrivateRoute>
              }
            />

            {/* Redirección explícita si alguien intenta cargar "/" tal cual
               y quieres que termine en /mis-pedidos en lugar de PedidosList,
               puedes mantener esta ruta suelta si la quieres,
               pero no con el mismo path "/".
               En tu código original había 2 <Route path="/" ...>,
               eso React Router lo ignora/sobrescribe.
               Te doy la redirección como ruta aparte: */}
            <Route
              path="/home"
              element={<Navigate to="/mis-pedidos" replace />}
            />

            <Route path="/mis-pedidos" element={<MisPedidos />} />
            <Route path="/cruceros" element={<Cruceros />} />

            <Route
              path="/ops"
              element={
                <StaffRoute>
                  <WorkerBoard />
                </StaffRoute>
              }
            />

            <Route path="/reminders" element={<Reminders />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
