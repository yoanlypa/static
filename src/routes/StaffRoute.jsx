import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";   // ya lo tienes
import { useStaff } from "../hooks/useStaff";

export default function StaffRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const { isLoading, isStaff } = useStaff();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-4">Cargando…</div>;
  if (!isStaff) return <Navigate to="/" replace />;

  return children;
}
