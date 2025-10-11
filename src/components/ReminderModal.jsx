// src/components/ReminderModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { remindersApi } from "../services/api";
import { parseDRFError } from "../utils/drfErrors";

export default function ReminderModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");   // YYYY-MM-DD
  const [time, setTime] = useState("");   // HH:MM
  const [notes, setNotes] = useState("");
  const [banner, setBanner] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    // reset estado
    setTitle(""); setDate(""); setTime(""); setNotes("");
    setBanner(null); setErrors({});
    // bloquear scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev || "");
  }, [open]);

  // Combina fecha + hora en una cadena tipo 2025-10-12T14:00:00
  const whenISO = useMemo(() => {
    if (!date) return "";
    const hhmm = time || "09:00";
    return `${date}T${hhmm}:00`;
  }, [date, time]);

  const createMut = useMutation({
    mutationFn: async () => {
      return remindersApi.create({
        title: title.trim(),
        when: whenISO,           // el api.js lo mapea a due_at
        notes: notes.trim(),
      });
    },
    onSuccess: () => {
      setBanner({ kind: "ok", msg: "Recordatorio creado" });
      onCreate?.();
      setTimeout(() => onClose?.(), 350);
    },
    onError: (err) => {
      const e = parseDRFError(err);      // muestra errores del backend (e.g. due_at requerido)
      setErrors(e || {});
      setBanner({ kind: "err", msg: "Revisa los campos marcados" });
    },
  });

  function validate() {
    const e = {};
    if (!title.trim()) e.title = "Pon un título.";
    if (!date) e.date = "Selecciona una fecha.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  if (!open) return null;

  const inputCls = "w-full border rounded p-3 text-base";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-lg flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Nuevo recordatorio</h3>
            <button
              className="text-slate-500 hover:text-slate-800 text-xl leading-none"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          {banner && (
            <div
              className={`mt-3 rounded p-2 ${
                banner.kind === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {banner.msg}
            </div>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!validate()) {
              setBanner({ kind: "err", msg: "Revisa los campos marcados" });
              return;
            }
            createMut.mutate();
          }}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        >
          <label className="text-sm block">
            Título
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Confirmar guía"
              required
            />
            {errors.title && <p className="text-rose-600 text-xs mt-1">{errors.title}</p>}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm block">
              Fecha
              <input
                type="date"
                className={inputCls}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              {errors.date && <p className="text-rose-600 text-xs mt-1">{errors.date}</p>}
            </label>

            <label className="text-sm block">
              Hora (opcional)
              <input
                type="time"
                className={inputCls}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>
          </div>

          <label className="text-sm block">
            Notas (opcional)
            <textarea
              className={`${inputCls} min-h-24`}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles…"
            />
            {errors.notes && <p className="text-rose-600 text-xs mt-1">{errors.notes}</p>}
          </label>
        </form>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-white sticky bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-3 rounded border text-base" onClick={onClose}>
              Cancelar
            </button>
            <button
              onClick={(e) => {
                const formEl = e.currentTarget.closest("[role='dialog']")?.querySelector("form");
                formEl?.requestSubmit();
              }}
              className="px-4 py-3 rounded bg-[#005dab] text-white text-base disabled:opacity-50"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
