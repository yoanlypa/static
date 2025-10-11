// src/components/Header.jsx
import { NavLink, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { meApi } from "../services/api";
import { useState } from "react";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
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

export default function Header() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await meApi.getMe()).data,
    staleTime: 60_000,
    retry: false,
  });

  const isAuthed = !!me?.id;
  const isStaff = !!me?.is_staff;
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-[#005dab] text-white font-bold">
              IT
            </span>
            <span className="font-semibold text-slate-800">Innovations Tours</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavItem to="/ops">Operaciones</NavItem>
          {isAuthed && <NavItem to="/reminders">Recordatorios</NavItem>}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthed ? (
            <div className="text-sm text-slate-600">
              {isStaff && <span className="mr-2 inline-block px-2 py-0.5 text-xs rounded bg-slate-100">Staff</span>}
              {me.email || me.username}
            </div>
          ) : (
            <NavItem to="/login">Entrar</NavItem>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded hover:bg-slate-100"
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-2xl">{open ? "×" : "≡"}</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
            <NavLink
              to="/ops"
              className="px-3 py-2 rounded hover:bg-slate-100 text-slate-700"
              onClick={() => setOpen(false)}
            >
              Operaciones
            </NavLink>
            {isAuthed && (
              <NavLink
                to="/reminders"
                className="px-3 py-2 rounded hover:bg-slate-100 text-slate-700"
                onClick={() => setOpen(false)}
              >
                Recordatorios
              </NavLink>
            )}

            <div className="pt-2 border-t mt-2 text-sm text-slate-600">
              {isAuthed ? (
                <div>
                  {isStaff && <span className="mr-2 inline-block px-2 py-0.5 text-xs rounded bg-slate-100">Staff</span>}
                  {me.email || me.username}
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="px-3 py-2 rounded hover:bg-slate-100 text-slate-700 inline-block"
                  onClick={() => setOpen(false)}
                >
                  Entrar
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
