import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { opsApi } from "../services/api";

function toISO(d) {
  if (!d) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T00:00:00Z`;
}

export default function WorkerBoard() {
  // rango por defecto: hoy → +14 días
  const today = new Date();
  const in14 = new Date(); in14.setDate(in14.getDate() + 14);

  const [filters, setFilters] = useState({
    status: "", // "pagado,entregado" etc
    date_from: toISO(today),
    date_to: toISO(in14),
  });

  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ops-orders", filters],
    queryFn: async () => {
      const { data } = await opsApi.listOpsOrders(filters);
      // DRF puede devolver {results:[...]} o array directo
      return Array.isArray(data) ? data : (data.results || []);
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

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Operaciones · Pedidos</h1>

      {/* Filtros */}
      <div className="grid md:grid-cols-4 gap-3 mb-4">
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
            value={filters.date_from?.slice(0, 10) || ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                date_from: e.target.value ? `${e.target.value}T00:00:00Z` : "",
              }))
            }
          />
        </label>
        <label className="text-sm">
          Hasta
          <input
            type="date"
            className="w-full border rounded p-2"
            value={filters.date_to?.slice(0, 10) || ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                date_to: e.target.value ? `${e.target.value}T23:59:59Z` : "",
              }))
            }
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            className="px-3 py-2 rounded bg-[#005dab] text-white"
            onClick={() => setFilters({
              status: "",
              date_from: toISO(today),
              date_to: toISO(in14),
            })}
          >
            Esta quincena
          </button>
        </div>
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
                {o.entregado ? " · entregado" : ""}{o.recogido ? " · recogido" : ""}
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
    </div>
  );
}
