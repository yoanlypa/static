import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from './components/Header.jsx';
import Login from "./pages/Login";
import PedidosList from "./pages/PedidosList";
import Cruceros from "./pages/Cruceros";
import MisPedidos from "./pages/MisPedidos";
import "./App.css";
import WorkerBoard from "./pages/WorkerBoard";
import StaffRoute from "./routes/StaffRoute";
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const queryClient = new QueryClient();

  return (
    <Router>
     
      <AuthProvider>
        <Header />
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={ <PrivateRoute> <PedidosList /> </PrivateRoute>} />
            <Route path="/" element={<Navigate to="/mis-pedidos" />} />
            <Route path="/mis-pedidos" element={<MisPedidos />} />
            <Route path="/cruceros"   element={<Cruceros />} />
            <Route path="/ops"element = { <StaffRoute> <WorkerBoard /> </StaffRoute> } />
          </Routes>
        </QueryClientProvider>
      </AuthProvider>
    </Router>
  );
}
