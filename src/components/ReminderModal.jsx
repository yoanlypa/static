import { useEffect, useMemo, useState } from "react";

/**
 * Modal simple para crear recordatorios.
 * De momento no golpea ningún endpoint (no lo has definido).
 * Si en el futuro expones /api/reminders/, aquí puedes añadir la mutación.
 */
export default function ReminderModal({ open, onClose, onCreate }) {
  // ✅ Hooks SIEMPRE al inicio (nunca detrás de un return condicional)
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");   // YYYY-MM-DD
  const [time, setTime] = useState("");   // HH:MM
  const [notes, setNotes] = useState("");
  const [banner, setBanner] = useState(null);
  const [errors, setErrors] = useState({});

  // Limpia el formulario cada vez que se abre
  useEffect(() => {
    if (open) {
      setTitle("");
      setDate("");
      setTime("");
      setNotes("");
      setBanner(null);
      setErrors({});
      // Evitar scroll en móvil con modal abierto
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev || "");
    }
  }, [open]);

  const whenISO = useMemo(() => {
    if (!date) return "";
    // si hay hora, combinamos; si no, 09:00 por defecto
    const hhmm = time || "09:00";
    return `${date}T${hhmm}:00`;
  }, [date, time]);

  // ⛔️ Importante: el return condicional va DESPUÉS de los hooks
  if (!open) return null;

  function validate() {
    const e = {};
    if (!title.trim()) e.title = "Pon un título.";
    if (!date) e.date = "Selecciona una fecha.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      setBanner({ kind: "err", msg: "Revisa los campos marcados" });
      return;
    }

    try {
      // Si más adelante tienes un endpoint, aquí haces la llamada.
      // Por ahora, simulamos “OK”.
      // await remindersApi.create({ title, when: whenISO, notes });

      setBanner({ kind: "ok", msg: "Recordatorio creado" });
      // Notifica al padre si quiere refrescar algo
      onCreate?.({ title, when: whenISO, notes });

      // Cierra tras un breve retardo para que el usuario vea el banner
      setTimeout(() => onClose?.(), 400);
    } catch (err) {
      setBanner({ kind: "err", msg: "No se pudo crear el recordatorio" });
    }
  }

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
                banner.kind === "ok"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {banner.msg}
            </div>
          )}
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <label className="text-sm block">
            Título
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete="off"
              placeholder="Ej. Recordar confirmar guía"
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
              placeholder="Detalles adicionales…"
            />
          </label>
        </form>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-white sticky bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-3 rounded border text-base"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={(e) => {
                const formEl = e.currentTarget.closest("[role='dialog']")?.querySelector("form");
                formEl?.requestSubmit();
              }}
              className="px-4 py-3 rounded bg-[#005dab] text-white text-base"
            >
              Guardar recordatorio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
