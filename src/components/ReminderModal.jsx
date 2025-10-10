import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { remindersApi } from "../services/api";
import { parseDRFError } from "../utils/drfErrors";

export default function ReminderModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", note: "", due_at: "" });
  const [banner, setBanner] = useState(null);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (!open) return;
    // reset al abrir
    setForm({ title: "", note: "", due_at: "" });
    setBanner(null); setErrors(null);
    // bloquear scroll móvil
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev || "");
  }, [open]);

  if (!open) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inputCls = "w-full border rounded p-3 text-base";

  const createMut = useMutation({
    mutationFn: () => remindersApi.create(form),
    onSuccess: () => {
      setBanner({ kind: "ok", msg: "Recordatorio creado." });
      setErrors(null);
      onCreated?.();
    },
    onError: (err) => {
      setErrors(parseDRFError(err));
      setBanner({ kind: "err", msg: "Revisa los campos" });
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-white rounded-t-2xl sm:rounded-xl shadow-lg flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Añadir recordatorio</h3>
            <button className="text-slate-500 hover:text-slate-800 text-xl leading-none" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>
          {banner && (
            <div className={`mt-3 rounded p-2 ${banner.kind === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {banner.msg}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={(e)=>{e.preventDefault(); createMut.mutate();}} className="flex-1 overflow-y-auto px-4 py-4">
          <label className="text-sm block mb-3">
            Título
            <input className={inputCls} value={form.title} onChange={set("title")} placeholder="Ej. Llamar al proveedor" required />
            {errors?.title && <p className="text-rose-600 text-xs mt-1">{errors.title}</p>}
          </label>

          <label className="text-sm block mb-3">
            Fecha y hora
            <input type="datetime-local" className={inputCls} value={form.due_at} onChange={set("due_at")} required />
            {errors?.due_at && <p className="text-rose-600 text-xs mt-1">{errors.due_at}</p>}
          </label>

          <label className="text-sm block mb-3">
            Nota (opcional)
            <textarea className={`${inputCls} min-h-24`} value={form.note} onChange={set("note")} />
            {errors?.note && <p className="text-rose-600 text-xs mt-1">{errors.note}</p>}
          </label>
        </form>

        {/* Footer fijo */}
        <div className="px-4 py-3 border-t bg-white sticky bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-3 rounded border text-base" onClick={onClose}>Cancelar</button>
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
