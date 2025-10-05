// src/components/Navbar.jsx
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useStaff } from "../hooks/useStaff";

function NavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `px-3 py-2 rounded hover:bg-slate-100 ${
          isActive ? "text-[#005dab] font-semibold" : "text-slate-700"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { isLoading, isStaff, me } = useStaff();

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <nav className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="h-14 flex items-center justify-between gap-2">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-bold text-[#005dab]">
            <span className="text-xl">Innovations Tours</span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-1">
            <NavItem to="/">Inicio</NavItem>
            <NavItem to="/cruceros">Cruceros</NavItem>

            {/* SOLO STAFF → Operaciones */}
            {!isLoading && isStaff && <NavItem to="/ops">Operaciones</NavItem>}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600">
                  {me?.username || me?.email || "Usuario"}
                  {(!isLoading && isStaff) && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      staff
                    </span>
                  )}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded border text-sm hover:bg-slate-50"
                >
                  Salir
                </button>
              </>
            ) : (
              <NavItem to="/login">Entrar</NavItem>
            )}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded hover:bg-slate-100"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t pb-2">
            <div className="flex flex-col pt-2">
              <NavItem to="/" onClick={close}>Inicio</NavItem>
              <NavItem to="/cruceros" onClick={close}>Cruceros</NavItem>
              {/* SOLO STAFF → Operaciones */}
              {!isLoading && isStaff && <NavItem to="/ops" onClick={close}>Operaciones</NavItem>}
            </div>

            <div className="mt-2 border-t pt-2 flex items-center justify-between">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-slate-600">
                    {me?.username || me?.email || "Usuario"}
                    {(!isLoading && isStaff) && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        staff
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => { logout(); close(); }}
                    className="px-3 py-2 rounded border text-sm"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <NavItem to="/login" onClick={close}>Entrar</NavItem>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
