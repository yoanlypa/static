// src/components/AddCruiseBulkModal.jsx
import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { opsApi } from "../services/api";

// status del lote para el endpoint bulk
const STATUS_OPTS = [
  { value: "preliminary", label: "Preliminary" },
  { value: "final", label: "Final" },
];

function emptyRow() {
  return {
    sign: "",
    excursion: "",
    language: "",
    pax: "",
    arrival_time: "",
  };
}

export default function AddCruiseBulkModal({ open, onClose }) {
  const [meta, setMeta] = useState({
    service_date: "",       // YYYY-MM-DD
    ship: "",
    status: "preliminary",
    terminal: "",
    supplier: "",
    emergency_contact: "",
    printing_date: "",      // YYYY-MM-DD (opcional)
  });
  const [rows, setRows] = useState([emptyRow()]);

  const canSubmit = useMemo(() => {
    return !!(meta.service_date && meta.ship && rows.length > 0 && rows.every(r => r.excursion && r.pax !== ""));
  }, [meta, rows]);

  const mut = useMutation({
    mutationFn: async () => {
      // construye el array de objetos para el bulk
      const payload = rows.map((r) => ({
        service_date: meta.service_date,    // "YYYY-MM-DD"
        ship: meta.ship,
        status: meta.status,                // preliminary|final
        terminal: meta.terminal || "",
        supplier: meta.supplier || "",
        emergency_contact: meta.emergency_contact || "",
        printing_date: meta.printing_date || null, // o "" si prefieres
        sign: r.sign || "",
        excursion: r.excursion || "",
        language: r.language || "",
        pax: r.pax ? Number(r.pax) : 0,
        arrival_time: r.arrival_time || "", // "HH:MM" opcional
      }));
      return opsApi.postCruiseBulk(payload);
    },
    onSuccess: () => {
      onClose?.();
    },
  });

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (idx) => setRows((rs) => rs.filter((_, i) => i !== idx));
  const updateRow = (idx, patch) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => !mut.isPending && onClose?.()} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl">
          <div className="px-4 py-3 border-b">
            <h3 className="text-lg font-semibold">Nuevo crucero (bulk)</h3>
          </div>

          {/* Metadatos del lote */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm">
              Fecha de servicio *
              <input
                type="date"
                className="w-full border rounded p-2"
                value={meta.service_date}
                onChange={(e) => setMeta({ ...meta, service_date: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Barco *
              <input
                className="w-full border rounded p-2"
                value={meta.ship}
                onChange={(e) => setMeta({ ...meta, ship: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Estado del lote *
              <select
                className="w-full border rounded p-2"
                value={meta.status}
                onChange={(e) => setMeta({ ...meta, status: e.target.value })}
              >
                {STATUS_OPTS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              Terminal
              <input
                className="w-full border rounded p-2"
                value={meta.terminal}
                onChange={(e) => setMeta({ ...meta, terminal: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Proveedor
              <input
                className="w-full border rounded p-2"
                value={meta.supplier}
                onChange={(e) => setMeta({ ...meta, supplier: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Contacto emergencias
              <input
                className="w-full border rounded p-2"
                value={meta.emergency_contact}
                onChange={(e) => setMeta({ ...meta, emergency_contact: e.target.value })}
              />
            </label>

            <label className="text-sm md:col-span-3">
              Fecha de impresión
              <input
                type="date"
                className="w-full border rounded p-2"
                value={meta.printing_date}
                onChange={(e) => setMeta({ ...meta, printing_date: e.target.value })}
              />
            </label>
          </div>

          {/* Tabla de excursiones */}
          <div className="px-4">
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="p-2 w-20">Bus</th>
                    <th className="p-2">Excursión *</th>
                    <th className="p-2">Idioma</th>
                    <th className="p-2 w-24">PAX *</th>
                    <th className="p-2 w-32">Hora llegada</th>
                    <th className="p-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx} className="odd:bg-slate-50">
                      <td className="p-2">
                        <input
                          className="w-full border rounded p-1"
                          value={r.sign}
                          onChange={(e) => updateRow(idx, { sign: e.target.value })}
                          placeholder="Sign"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="w-full border rounded p-1"
                          value={r.excursion}
                          onChange={(e) => updateRow(idx, { excursion: e.target.value })}
                          placeholder="Ej: City tour"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="w-full border rounded p-1"
                          value={r.language}
                          onChange={(e) => updateRow(idx, { language: e.target.value })}
                          placeholder="ES/EN/FR…"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          className="w-full border rounded p-1"
                          value={r.pax}
                          onChange={(e) => updateRow(idx, { pax: e.target.value })}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="time"
                          className="w-full border rounded p-1"
                          value={r.arrival_time}
                          onChange={(e) => updateRow(idx, { arrival_time: e.target.value })}
                        />
                      </td>
                      <td className="p-2">
                        <button
                          className="px-2 py-1 text-xs rounded border hover:bg-slate-50"
                          onClick={() => removeRow(idx)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 rounded border" onClick={addRow}>Añadir excursión</button>
            </div>
          </div>

          <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
            <button className="px-4 py-2 rounded border" onClick={() => !mut.isPending && onClose?.()} disabled={mut.isPending}>
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded bg-[#005dab] text-white disabled:opacity-60"
              onClick={() => mut.mutate()}
              disabled={!canSubmit || mut.isPending}
            >
              {mut.isPending ? "Creando…" : "Crear lote"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
