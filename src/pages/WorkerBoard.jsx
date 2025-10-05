// src/pages/WorkerBoard.jsx
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { opsApi } from "../services/api";
import DeliverModal from "../components/DeliverModal";

function toISODate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function rangeToday() {
  const d = new Date();
  const s = `${toISODate(d)}T00:00:00Z`;
  const e = `${toISODate(d)}T23:59:59Z`;
  return { s, e };
}
function rangeTomorrow() {
  const d = new Date(); d.setDate(d.getDate()+1);
  const s = `${toISODate(d)}T00:00:00Z`;
  const e = `${toISODate(d)}T23:59:59Z`;
  return { s, e };
}
function rangeWeek() {
  const d = new Date();
  const day = d.getDay(); // 0=Dom
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const start = new Date(d); start.setDate(d.getDate() + diffToMon);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return { s: `${toISODate(start)}T00:00:00Z`, e: `${toISODate(end)}T23:59:59Z` };
}
function rangeMonth() {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth()+1, 0);
  return { s: `${toISODate(start)}T00:00:00Z`, e: `${toISODate(end)}T23:59:59Z` };
}

const badgeCls = {
  pendiente_pago: "bg-amber-100 text-amber-800",
  pagado: "bg-emerald-100 text-emerald-800",
  aprobado: "bg-sky-100 text-sky-800",
  entregado: "bg-indigo-100 text-indigo-800",
  recogido: "bg-slate-200 text-slate-800",
};

export default function WorkerBoard() {
  // rango por defecto: hoy → +14
  const today = new Date();
  const in14 = new Date(); in14.setDate(in14.getDate() + 14);

  const [filters, setFilters] = useState({
    status: "",
    date_from: `${toISODate(today)}T00:00:00Z`,
    date_to: `${toISODate(in14)}T23:59:59Z`,
    tipo_servicio: "", // opcional
    search: "",        // opcional
  });

  const [deliverOpen, setDeliverOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ops-orders", filters],
    queryFn: async () => {
      const { data } = await opsApi.listOpsOrders(filters);
      return Array.isArray(data) ? data : (data.results || []);
    },
    refetchOnWindowFocus: false,
  });

  const deliveredMut = useMutation({
    mutationFn: ({ id, body }) => opsApi.markDelivered(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ops-orders"] }),
  });
  const collectedMut = useMutation({
    mutationFn: (id) => opsApi.markCollected(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ops-orders"] }),
  });

  const list = useMemo(() => data || [], [data]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <h1 className="text-2xl font-bold">Operaciones · Pedidos</h1>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => {
              const { s, e } = rangeToday();
              setFilters((f) => ({ ...f, date_from: s, date_to: e }));
            }}
          >
            Hoy
          </button>
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => {
              const { s, e } = rangeTomorrow();
              setFilters((f) => ({ ...f, date_from: s, date_to: e }));
            }}
          >
            Mañana
          </button>
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => {
              const { s, e } = rangeWeek();
              setFilters((f) => ({ ...f, date_from: s, date_to: e }));
            }}
          >
            Esta semana
          </button>
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => {
              const { s, e } = rangeMonth();
              setFilters((f) => ({ ...f, date_from: s, date_to: e }));
            }}
          >
            Este mes
          </button>
        </div>
      </div>

      {/* Barra de filtros detallados */}
      <div className="grid md:grid-cols-5 gap-3 mb-4">
        <label className="text-sm">
          Estado
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
        <label className="text-sm">
          Tipo servicio
          <select
            className="w-full border rounded p-2"
            value={filters.tipo_servicio}
            onChange={(e) => setFilters((f) => ({ ...f, tipo_servicio: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="mediodia">Medio día</option>
            <option value="dia_Completo">Día completo</option>
            <option value="circuito">Circuito</option>
            <option value="crucero">Crucero</option>
          </select>
        </label>
        <label className="text-sm">
          Buscar
          <input
            className="w-full border rounded p-2"
            placeholder="empresa / excursión / bono / guía…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </label>
      </div>

      {isLoading && <div>Cargando…</div>}
      {isError && <pre className="text-red-600">{String(error)}</pre>}

      {/* Listado */}
      <div className="grid gap-3">
        {list.map((o) => (
          <div key={o.id} className="border rounded p-3 bg-white">
            <div className="flex justify-between flex-wrap gap-2 items-center">
              <div className="font-semibold">
                #{o.id} — {o.empresa} {o.excursion ? `• ${o.excursion}` : ""}
              </div>
              <span className={`text-xs px-2 py-1 rounded ${badgeCls[o.estado] || "bg-slate-100 text-slate-800"}`}>
                {o.estado}
              </span>
            </div>

            <div className="text-sm text-slate-600 mt-1">
              {o.lugar_entrega || "—"} → {o.lugar_recogida || "—"} ·{" "}
              {o.fecha_inicio ? new Date(o.fecha_inicio).toLocaleDateString() : "—"}
              {o.fecha_fin ? ` — ${new Date(o.fecha_fin).toLocaleDateString()}` : ""}
              {o.pax ? ` · ${o.pax} pax` : ""}
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                disabled={o.estado === "entregado" || deliveredMut.isPending}
                onClick={() => {
                  setSelected(o);
                  setDeliverOpen(true);
                }}
              >
                Marcar entregado
              </button>
              <button
                className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
                disabled={o.estado !== "entregado" || collectedMut.isPending}
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

      {/* Modal de entregar */}
      <DeliverModal
        open={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        pedido={selected}
        onConfirm={(body) => {
          if (!selected) return;
          deliveredMut.mutate(
            { id: selected.id, body },
            {
              onSuccess: () => {
                setDeliverOpen(false);
                setSelected(null);
              },
            }
          );
        }}
      />
    </div>
  );
}
