import { useEffect, useState } from "react";

export default function ReminderModal({ open, onClose }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");   // YYYY-MM-DD
  const [time, setTime] = useState("");   // HH:MM
  const [notes, setNotes] = useState("");
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev || "");
  }, [open]);

  if (!open) return null;

  const inputCls = "w-full border rounded p-3 text-base";

  function scheduleNotification(when, titleText, bodyText) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") scheduleNotification(when, titleText, bodyText);
      });
      return;
    }
    if (Notification.permission !== "granted") return;

    const ms = when.getTime() - Date.now();
    if (ms <= 0) {
      new Notification(titleText, { body: bodyText || "Recordatorio" });
      return;
    }
    // Timer no persiste si cierran la pestaña; sirve como aviso rápido.
    setTimeout(() => {
      new Notification(titleText, { body: bodyText || "Recordatorio" });
    }, Math.min(ms, 2147483647)); // máx setTimeout ~24.8 días
  }

  function saveLocal(rem) {
    const key = "reminders";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.push(rem);
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!title || !date || !time) {
      setBanner({ kind: "err", msg: "Título, fecha y hora son obligatorios." });
      return;
    }
    const when = new Date(`${date}T${time}:00`);
    if (isNaN(when.getTime())) {
      setBanner({ kind: "err", msg: "Fecha u hora inválidas." });
      return;
    }
    const rem = {
      id: crypto.randomUUID(),
      title,
      notes,
      at: when.toISOString(),
      created_at: new Date().toISOString(),
    };
    saveLocal(rem);
    scheduleNotification(when, title, notes);
    setBanner({ kind: "ok", msg: "Recordatorio creado." });
    setTimeout(() => {
      onClose?.();
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-lg flex flex-col">
        <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Nuevo recordatorio</h3>
            <button className="text-slate-500 hover:text-slate-800 text-xl leading-none" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>
          {banner && (
            <div className={`mt-3 rounded p-2 ${banner.kind === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {banner.msg}
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-4 py-4">
          <label className="text-sm block mb-3">
            Título
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="text-sm">
              Fecha
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className="text-sm">
              Hora
              <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} required />
            </label>
          </div>
          <label className="text-sm block">
            Notas (opcional)
            <textarea className={`${inputCls} min-h-24`} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <p className="text-xs text-slate-500 mt-3">
            Los recordatorios se guardan en este navegador y lanzan una notificación local.
            Si quieres que persistan en servidor (multi-dispositivo), podemos conectar un endpoint más adelante.
          </p>
        </form>

        <div className="px-4 py-3 border-t bg-white sticky bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-3 rounded border text-base" onClick={onClose}>Cancelar</button>
            <button className="px-4 py-3 rounded bg-[#005dab] text-white text-base">Crear recordatorio</button>
          </div>
        </div>
      </div>
    </div>
  );
}
