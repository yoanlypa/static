// src/components/AddOrderModal.jsx
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { opsApi } from "../services/api";

const TIPO_SERVICIO_OPTS = [
  { value: "", label: "— Sin especificar —" },
  { value: "dia_completo", label: "Día completo" },
  { value: "circuito", label: "Circuito" },
  { value: "mismo_dia", label: "Mismo día" },
  { value: "crucero", label: "Crucero" }, // Nota: este modal es para pedido “estándar”; para crucero usaremos otro modal
];

function toISO(dateStr, timeStr) {
  if (!dateStr) return null;
  const t = timeStr && timeStr.trim() ? timeStr : "00:00";
  const [h, m] = t.split(":").map((x) => parseInt(x || "0", 10));
  const d = new Date(dateStr);
  d.setHours(h || 0, m || 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");
}

export default function AddOrderModal({ open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    empresa_id: "",
    excursion: "",
    estado: "pagado",
    lugar_entrega: "",
    lugar_recogida: "",
    fecha_inicio_d: "",
    fecha_inicio_t: "",
    fecha_fin_d: "",
    fecha_fin_t: "",
    pax: "",
    bono: "",
    guia: "",
    tipo_servicio: "", // ahora con las 4 opciones
    emisores: "",
    notas: "",
  });

  const disabled = useMemo(() => !(form.empresa_id && form.fecha_inicio_d), [form]);

  const createMut = useMutation({
    mutationFn: async () => {
      const payload = {
        empresa: form.empresa_id ? Number(form.empresa_id) : null,
        excursion: form.excursion || "",
        estado: form.estado || "pagado",
        lugar_entrega: form.lugar_entrega || "",
        lugar_recogida: form.lugar_recogida || "",
        fecha_inicio: toISO(form.fecha_inicio_d, form.fecha_inicio_t),
        fecha_fin: form.fecha_fin_d ? toISO(form.fecha_fin_d, form.fecha_fin_t) : null,
        pax: form.pax ? Number(form.pax) : 0,
        bono: form.bono || "",
        guia: form.guia || "",
        tipo_servicio: form.tipo_servicio || "",
        emisores: form.emisores || "",
        notas: form.notas || "",
      };
      return opsApi.createOrder(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-orders"] });
      onClose?.();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => !createMut.isPending && onClose?.()} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
          <div className="px-4 py-3 border-b">
            <h3 className="text-lg font-semibold">Nuevo pedido</h3>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">
              Empresa ID *
              <input
                className="w-full border rounded p-2"
                placeholder="ID numérico"
                value={form.empresa_id}
                onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
              />
            </label>

            <label className="text-sm">
              Estado
              <select
                className="w-full border rounded p-2"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                <option value="pagado">Pagado</option>
                <option value="entregado">Entregado</option>
                <option value="recogido">Recogido</option>
              </select>
            </label>

            <label className="text-sm">
              Tipo de servicio
              <select
                className="w-full border rounded p-2"
                value={form.tipo_servicio}
                onChange={(e) => setForm({ ...form, tipo_servicio: e.target.value })}
              >
                {TIPO_SERVICIO_OPTS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500">
                Para “Crucero” usa el botón “Nuevo crucero” (tiene su propio formulario).
              </span>
            </label>

            <label className="text-sm md:col-span-2">
              Excursión
              <input
                className="w-full border rounded p-2"
                value={form.excursion}
                onChange={(e) => setForm({ ...form, excursion: e.target.value })}
              />
            </label>

            <label className="text-sm">
              Lugar de entrega
              <input
                className="w-full border rounded p-2"
                value={form.lugar_entrega}
                onChange={(e) => setForm({ ...form, lugar_entrega: e.target.value })}
              />
            </label>

            <label className="text-sm">
              Lugar de recogida
              <input
                className="w-full border rounded p-2"
                value={form.lugar_recogida}
                onChange={(e) => setForm({ ...form, lugar_recogida: e.target.value })}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">
                Inicio (fecha) *
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={form.fecha_inicio_d}
                  onChange={(e) => setForm({ ...form, fecha_inicio_d: e.target.value })}
                />
              </label>
              <label className="text-sm">
                Inicio (hora)
                <input
                  type="time"
                  className="w-full border rounded p-2"
                  value={form.fecha_inicio_t}
                  onChange={(e) => setForm({ ...form, fecha_inicio_t: e.target.value })}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">
                Fin (fecha)
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={form.fecha_fin_d}
                  onChange={(e) => setForm({ ...form, fecha_fin_d: e.target.value })}
                />
              </label>
              <label className="text-sm">
                Fin (hora)
                <input
                  type="time"
                  className="w-full border rounded p-2"
                  value={form.fecha_fin_t}
                  onChange={(e) => setForm({ ...form, fecha_fin_t: e.target.value })}
                />
              </label>
            </div>

            <label className="text-sm">
              PAX
              <input
                type="number"
                min="0"
                className="w-full border rounded p-2"
                value={form.pax}
                onChange={(e) => setForm({ ...form, pax: e.target.value })}
              />
            </label>

            <label className="text-sm">
              Bono
              <input
                className="w-full border rounded p-2"
                value={form.bono}
                onChange={(e) => setForm({ ...form, bono: e.target.value })}
              />
            </label>

            <label className="text-sm">
              Guía
              <input
                className="w-full border rounded p-2"
                value={form.guia}
                onChange={(e) => setForm({ ...form, guia: e.target.value })}
              />
            </label>

            <label className="text-sm">
              Emisores
              <input
                className="w-full border rounded p-2"
                value={form.emisores}
                onChange={(e) => setForm({ ...form, emisores: e.target.value })}
              />
            </label>

            <label className="text-sm md:col-span-2">
              Notas
              <textarea
                className="w-full border rounded p-2"
                rows="3"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
              />
            </label>
          </div>

          <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
            <button className="px-4 py-2 rounded border" onClick={() => !createMut.isPending && onClose?.()} disabled={createMut.isPending}>Cancelar</button>
            <button className="px-4 py-2 rounded bg-[#005dab] text-white disabled:opacity-60" onClick={() => createMut.mutate()} disabled={disabled || createMut.isPending}>
              {createMut.isPending ? "Creando…" : "Crear pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
