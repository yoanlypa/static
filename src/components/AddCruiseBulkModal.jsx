// src/components/AddCruiseBulkModal.jsx
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { opsApi } from "../services/api";

const STATUS_OPTS = [
  { value: "preliminary", label: "Preliminary" },
  { value: "final", label: "Final" },
];

function emptyRow() {
  return { sign: "", excursion: "", language: "", pax: "", arrival_time: "" };
}

function Toast({ kind = "success", children, onClose }) {
  const bg = kind === "error" ? "bg-red-600" : "bg-emerald-600";
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${bg} text-white px-4 py-2 rounded shadow z-[60]`}>
      <div className="flex items-center gap-3">
        <span className="font-medium">{children}</span>
        <button className="ml-2 underline" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

export default function AddCruiseBulkModal({ open, onClose }) {
  const qc = useQueryClient();

  const [meta, setMeta] = useState({
    empresa_id: "",
    service_date: "",
    ship: "",
    status: "preliminary",
    terminal: "",
    supplier: "",
    emergency_contact: "",
    printing_date: "",

    estado_pedido: "pagado",
    lugar_entrega: "",
    lugar_recogida: "",
    emisores: "",       // numérico o vacío
  });
  const [rows, setRows] = useState([emptyRow()]);

  // Manejo de errores
  const [generalErr, setGeneralErr] = useState("");
  const [rowErrors, setRowErrors] = useState([]); // array de objetos por fila
  const [showToast, setShowToast] = useState(null); // {kind, msg}

  const canSubmit = useMemo(() => {
    const baseOK = meta.service_date && meta.ship && meta.empresa_id;
    const rowsOK = rows.length > 0 && rows.every(r => r.excursion && r.pax !== "");
    return baseOK && rowsOK;
  }, [meta, rows]);

  const mut = useMutation({
    mutationFn: async () => {
      setGeneralErr("");
      setRowErrors([]);

      // arma meta sin campos vacíos
      const metaPayload = {
        service_date: meta.service_date,
        ship: meta.ship,
        status: meta.status,
        terminal: meta.terminal || undefined,
        supplier: meta.supplier || undefined,
        emergency_contact: meta.emergency_contact || undefined,
        // printing_date solo si tiene valor
        ...(meta.printing_date ? { printing_date: meta.printing_date } : {}),
        // para crear Pedidos
        empresa: meta.empresa_id ? Number(meta.empresa_id) : undefined,
        estado_pedido: meta.estado_pedido || undefined,
        lugar_entrega: meta.lugar_entrega || undefined,
        lugar_recogida: meta.lugar_recogida || undefined,
      };

      // emisores: solo si es número válido
      const emi = (meta.emisores || "").trim();
      if (/^\d+$/.test(emi)) {
        metaPayload.emisores = Number(emi);
      }

      const rowsPayload = rows.map(r => ({
        sign: (r.sign || "").trim(),
        excursion: (r.excursion || "").trim(),
        language: (r.language || "").trim(),
        pax: r.pax ? Number(r.pax) : 0,
        arrival_time: (r.arrival_time || "").trim(),
      }));

      return opsApi.postCruiseBulk({ meta: metaPayload, rows: rowsPayload });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["ops-orders"] });
      setShowToast({ kind: "success", msg: "Lote creado correctamente." });
      onClose?.();
    },
    onError: (err) => {
      // DRF puede devolver lista de errores por fila o dict de errores
      const data = err?.response?.data;
      if (Array.isArray(data)) {
        // errores por fila [{field: ["msg"]}, ...]
        setRowErrors(data);
        setShowToast({ kind: "error", msg: "Revisa los campos resaltados." });
      } else if (data && typeof data === "object") {
        // error general
        setGeneralErr(JSON.stringify(data));
        setShowToast({ kind: "error", msg: "No se pudo crear el lote." });
      } else {
        setGeneralErr(String(err));
        setShowToast({ kind: "error", msg: "Error inesperado." });
      }
    },
  });

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (idx) => {
    setRows((rs) => rs.filter((_, i) => i !== idx));
    setRowErrors((es) => es.filter((_, i) => i !== idx));
  };
  const updateRow = (idx, patch) => {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    // limpia errores de esa celda si existían
    setRowErrors((es) => {
      const copy = [...es];
      copy[idx] = { ...(copy[idx] || {}), ...Object.fromEntries(Object.keys(patch).map(k => [k, undefined])) };
      return copy;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => !mut.isPending && onClose?.()} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl">
          <div className="px-4 py-3 border-b">
            <h3 className="text-lg font-semibold">Nuevo crucero (lote)</h3>
          </div>

          {generalErr && (
            <div className="mx-4 mt-3 rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              {generalErr}
            </div>
          )}

          {/* META */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm">
              Empresa ID * (creará Pedidos)
              <input
                className="w-full border rounded p-2"
                value={meta.empresa_id}
                onChange={(e) => setMeta({ ...meta, empresa_id: e.target.value })}
                placeholder="ID numérico"
              />
            </label>
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
              Estado del lote
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
            <label className="text-sm">
              Fecha de impresión
              <input
                type="date"
                className="w-full border rounded p-2"
                value={meta.printing_date}
                onChange={(e) => setMeta({ ...meta, printing_date: e.target.value })}
              />
              <span className="text-xs text-slate-500">
                (Opcional; si la dejas vacía no se enviará)
              </span>
            </label>
            <label className="text-sm">
              Estado de los Pedidos
              <select
                className="w-full border rounded p-2"
                value={meta.estado_pedido}
                onChange={(e) => setMeta({ ...meta, estado_pedido: e.target.value })}
              >
                <option value="pagado">Pagado</option>
                <option value="entregado">Entregado</option>
                <option value="recogido">Recogido</option>
                <option value="pendiente_pago">Pendiente pago</option>
              </select>
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
                  {rows.map((r, idx) => {
                    const err = rowErrors[idx] || {};
                    const errText = (k) => Array.isArray(err[k]) ? err[k].join(", ") : (err[k] || "");
                    return (
                      <tr key={idx} className="odd:bg-slate-50 align-top">
                        <td className="p-2">
                          <input
                            className={`w-full border rounded p-1 ${err.sign ? "border-red-400" : ""}`}
                            value={r.sign}
                            onChange={(e) => updateRow(idx, { sign: e.target.value })}
                            placeholder="Sign"
                          />
                          {err.sign && <div className="text-xs text-red-600 mt-1">{errText("sign")}</div>}
                        </td>
                        <td className="p-2">
                          <input
                            className={`w-full border rounded p-1 ${err.excursion ? "border-red-400" : ""}`}
                            value={r.excursion}
                            onChange={(e) => updateRow(idx, { excursion: e.target.value })}
                            placeholder="Ej: City tour"
                          />
                          {err.excursion && <div className="text-xs text-red-600 mt-1">{errText("excursion")}</div>}
                        </td>
                        <td className="p-2">
                          <input
                            className={`w-full border rounded p-1 ${err.language ? "border-red-400" : ""}`}
                            value={r.language}
                            onChange={(e) => updateRow(idx, { language: e.target.value })}
                            placeholder="ES/EN/FR…"
                          />
                          {err.language && <div className="text-xs text-red-600 mt-1">{errText("language")}</div>}
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            className={`w-full border rounded p-1 ${err.pax ? "border-red-400" : ""}`}
                            value={r.pax}
                            onChange={(e) => updateRow(idx, { pax: e.target.value })}
                          />
                          {err.pax && <div className="text-xs text-red-600 mt-1">{errText("pax")}</div>}
                        </td>
                        <td className="p-2">
                          <input
                            type="time"
                            className={`w-full border rounded p-1 ${err.arrival_time ? "border-red-400" : ""}`}
                            value={r.arrival_time}
                            onChange={(e) => updateRow(idx, { arrival_time: e.target.value })}
                          />
                          {err.arrival_time && <div className="text-xs text-red-600 mt-1">{errText("arrival_time")}</div>}
                          {/* Si el backend devuelve error de printing_date como fila, muéstralo aquí también */}
                          {err.printing_date && <div className="text-xs text-red-600 mt-1">{errText("printing_date")}</div>}
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 rounded border" onClick={addRow}>Añadir excursión</button>
            </div>
          </div>

          <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
            <button className="px-4 py-2 rounded border" onClick={() => !mut.isPending && onClose?.()} disabled={mut.isPending}>Cancelar</button>
            <button className="px-4 py-2 rounded bg-[#005dab] text-white disabled:opacity-60" onClick={() => mut.mutate()} disabled={!canSubmit || mut.isPending}>
              {mut.isPending ? "Creando…" : "Crear lote"}
            </button>
          </div>
        </div>
      </div>

      {showToast && (
        <Toast kind={showToast.kind} onClose={() => setShowToast(null)}>
          {showToast.msg}
        </Toast>
      )}
    </div>
  );
}
