// src/pages/WorkerBoard.jsx
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { opsApi } from "../services/api";
import AddOrderModal from "../components/AddOrderModal";

function toISODateStartZ(dateStr) {
  return `${dateStr}T00:00:00Z`;
}
function toISODateEndZ(dateStr) {
  return `${dateStr}T23:59:59Z`;
}
function fmt(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function rangePreset(preset) {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);

  if (preset === "hoy") {
    const d = fmt(today);
    return { from: toISODateStartZ(d), to: toISODateEndZ(d) };
  }
  if (preset === "manana") {
    const t = new Date(today); t.setDate(t.getDate() + 1);
    const d = fmt(t);
    return { from: toISODateStartZ(d), to: toISODateEndZ(d) };
  }
  if (preset === "esta_semana") {
    const day = today.getDay(); // 0=Dom, 1=Lun...
    const monday = new Date(today);
    const diffToMon = (day === 0 ? -6 : 1 - day); // Lunes
    monday.setDate(today.getDate() + diffToMon);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    return { from: toISODateStartZ(fmt(monday)), to: toISODateEndZ(fmt(sunday)) };
  }
  if (preset === "este_mes") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: toISODateStartZ(fmt(first)), to: toISODateEndZ(fmt(last)) };
  }
  if (preset === "esta_quincena") {
    const in14 = new Date(today); in14.setDate(in14.getDate() + 14);
    return { from: toISODateStartZ(fmt(today)), to: toISODateEndZ(fmt(in14)) };
  }
  return { from: "", to: "" };
}

export default function WorkerBoard() {
  // filtros iniciales: hoy→+14 días (quincena)
  const q15 = rangePreset("esta_quincena");
  const [filters, setFilters] = useState({
    status: "",
    date_from: q15.from,
    date_to: q15.to,
  });

  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ops-orders", filters],
    queryFn: async () => {
      const { data } = await opsApi.listOpsOrders(filters);
      return Array.isArray(data) ? data : data.results || [];
    },
    refetchOnWindowFocus: false,
  });

  const deliveredMut = useMutation({
    mutationFn: (id) => opsApi.markDelivered(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ops-orders"] }),
  });
  const collectedMut = useMutation({
    mutationFn: (id) => opsApi.markCollected(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ops-orders"] }),
  });

  const list = useMemo(() => data || [], [data]);

  const applyPreset = (key) => {
    const r = rangePreset(key);
    setFilters((f) => ({ ...f, date_from: r.from, date_to: r.to }));
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Operaciones · Pedidos</h1>

      {/* Filtros */}
      <div className="grid md:grid-cols-4 gap-3 mb-3">
        <label className="text-sm">
          Estado (coma-separado)
          <input
            className="w-full border rounded p-2"
            placeholder="pagado,entregado,recogido"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          />
        </label>

        <label className="text-sm">
          Desde
          <input
            type="date"
            className="w-full border rounded p-2"
            value={filters.date_from ? filters.date_from.slice(0, 10) : ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                date_from: e.target.value ? toISODateStartZ(e.target.value) : "",
              }))
            }
          />
        </label>

        <label className="text-sm">
          Hasta
          <input
            type="date"
            className="w-full border rounded p-2"
            value={filters.date_to ? filters.date_to.slice(0, 10) : ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                date_to: e.target.value ? toISODateEndZ(e.target.value) : "",
              }))
            }
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            className="px-3 py-2 rounded bg-[#005dab] text-white"
            onClick={() => applyPreset("esta_quincena")}
          >
            Esta quincena
          </button>
        </div>
      </div>

      {/* Presets rápidos */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className="px-3 py-1 rounded-full border hover:bg-slate-50"
          onClick={() => applyPreset("hoy")}
        >
          Hoy
        </button>
        <button
          className="px-3 py-1 rounded-full border hover:bg-slate-50"
          onClick={() => applyPreset("manana")}
        >
          Mañana
        </button>
        <button
          className="px-3 py-1 rounded-full border hover:bg-slate-50"
          onClick={() => applyPreset("esta_semana")}
        >
          Esta semana
        </button>
        <button
          className="px-3 py-1 rounded-full border hover:bg-slate-50"
          onClick={() => applyPreset("este_mes")}
        >
          Este mes
        </button>
        <button
          className="px-3 py-1 rounded-full border hover:bg-slate-50"
          onClick={() => setFilters({ status: "", date_from: "", date_to: "" })}
        >
          Limpiar
        </button>
      </div>

      {isLoading && <div>Cargando…</div>}
      {isError && <pre className="text-red-600">{String(error)}</pre>}

      <div className="grid gap-3">
        {list.map((o) => (
          <div key={o.id} className="border rounded p-3 bg-white">
            <div className="flex justify-between flex-wrap gap-2">
              <div className="font-semibold">
                #{o.id} — {o.empresa} {o.excursion ? `• ${o.excursion}` : ""}
              </div>
              <div className="text-sm">
                {o.estado}
                {o.entregado ? " · entregado" : ""}
                {o.recogido ? " · recogido" : ""}
              </div>
            </div>

            <div className="text-sm text-slate-600 mt-1">
              {o.lugar_entrega || "—"} → {o.lugar_recogida || "—"} ·{" "}
              {o.fecha_inicio ? new Date(o.fecha_inicio).toLocaleString() : "—"}
              {o.fecha_fin ? ` — ${new Date(o.fecha_fin).toLocaleString()}` : ""}
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                disabled={deliveredMut.isPending || o.entregado}
                onClick={() => deliveredMut.mutate(o.id)}
              >
                Marcar entregado
              </button>
              <button
                className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
                disabled={collectedMut.isPending || o.recogido}
                onClick={() => collectedMut.mutate(o.id)}
              >
                Marcar recogido
              </button>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && !isLoading && (
        <div className="text-slate-500 mt-6">No hay pedidos para este rango.</div>
      )}

      {/* FAB para crear pedido */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#005dab] text-white text-2xl shadow-lg hover:brightness-110"
        title="Nuevo pedido"
        onClick={() => setShowNew(true)}
      >
        +
      </button>

      <AddOrderModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}
