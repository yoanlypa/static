import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { opsApi } from "../services/api";
import AddOrderModal from "../components/AddOrderModal";
import { toCsv, downloadCsv } from "../utils/csv";

function toISODate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function rangeToday() {
  const d = new Date();
  return { s: `${toISODate(d)}T00:00:00Z`, e: `${toISODate(d)}T23:59:59Z` };
}
function rangeTomorrow() {
  const d = new Date(); d.setDate(d.getDate()+1);
  return { s: `${toISODate(d)}T00:00:00Z`, e: `${toISODate(d)}T23:59:59Z` };
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

function isOverdue(o) {
  if (!o?.fecha_inicio) return false;
  const d = new Date(o.fecha_inicio);
  const today = new Date(); today.setHours(0,0,0,0);
  return d < today && o.estado !== "entregado" && o.estado !== "recogido";
}

function SkeletonCard() {
  return (
    <div className="border rounded p-3 bg-white animate-pulse">
      <div className="h-4 w-1/3 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-2/3 bg-slate-200 rounded mb-3" />
      <div className="h-8 w-1/4 bg-slate-200 rounded" />
    </div>
  );
}

export default function WorkerBoard() {
  // rango por defecto: hoy → +14
  const today = new Date();
  const in14 = new Date(); in14.setDate(in14.getDate() + 14);

  const [filters, setFilters] = useState({
    status: "",
    date_from: `${toISODate(today)}T00:00:00Z`,
    date_to: `${toISODate(in14)}T23:59:59Z`,
    tipo_servicio: "",
    search: "",
  });

  const [sortDir, setSortDir] = useState("asc");    // asc|desc por fecha_inicio
  const [compact, setCompact] = useState(false);    // vista compacta
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

  // Ordenar & agrupar por fecha_inicio (YYYY-MM-DD)
  const grouped = useMemo(() => {
    const arr = (data || []).slice().sort((a, b) => {
      const da = a.fecha_inicio || "";
      const db = b.fecha_inicio || "";
      return sortDir === "asc" ? da.localeCompare(db) : db.localeCompare(da);
    });
    const byDate = {};
    for (const o of arr) {
      const key = (o.fecha_inicio || "—").slice(0,10);
      byDate[key] ??= [];
      byDate[key].push(o);
    }
    return byDate;
  }, [data, sortDir]);

  const dateKeys = useMemo(() => Object.keys(grouped), [grouped]);

  function exportCurrentCsv() {
    const rows = (data || []);
    const headers = [
      { label: "ID", get: (r) => r.id },
      { label: "Empresa", get: (r) => r.empresa },
      { label: "Excursion", get: (r) => r.excursion || "" },
      { label: "Estado", get: (r) => r.estado },
      { label: "Tipo", get: (r) => r.tipo_servicio },
      { label: "FechaInicio", get: (r) => r.fecha_inicio || "" },
      { label: "FechaFin", get: (r) => r.fecha_fin || "" },
      { label: "PAX", get: (r) => r.pax ?? "" },
      { label: "Bono", get: (r) => r.bono || "" },
      { label: "Guia", get: (r) => r.guia || "" },
      { label: "Entrega", get: (r) => r.lugar_entrega || "" },
      { label: "Recogida", get: (r) => r.lugar_recogida || "" },
    ];
    const csv = toCsv(rows, headers);
    downloadCsv(`pedidos_${toISODate(new Date())}.csv`, csv);
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header + Acciones */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <h1 className="text-2xl font-bold">Operaciones · Pedidos</h1>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => {
              const { s, e } = rangeToday();
              setFilters((f) => ({ ...f, date_from: s, date_to: e }));
            }}
          >Hoy</button>
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => {
              const { s, e } = rangeTomorrow();
              setFilters((f) => ({ ...f, date_from: s, date_to: e }));
            }}
          >Mañana</button>
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => {
              const { s, e } = rangeWeek();
              setFilters((f) => ({ ...f, date_from: s, date_to: e }));
            }}
          >Esta semana</button>
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => {
              const { s, e } = rangeMonth();
              setFilters((f) => ({ ...f, date_from: s, date_to: e }));
            }}
          >Este mes</button>

          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={exportCurrentCsv}
            title="Exportar CSV de lo filtrado"
          >
            Exportar CSV
          </button>

          <div className="ml-2 inline-flex overflow-hidden rounded border">
            <button
              className={`px-2.5 py-1 text-xs ${sortDir === "asc" ? "bg-[#005dab] text-white" : "bg-white"}`}
              onClick={() => setSortDir("asc")}
            >Fecha ↑</button>
            <button
              className={`px-2.5 py-1 text-xs border-l ${sortDir === "desc" ? "bg-[#005dab] text-white" : "bg-white"}`}
              onClick={() => setSortDir("desc")}
            >Fecha ↓</button>
          </div>

          <label className="flex items-center gap-2 text-sm ml-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={compact}
              onChange={(e) => setCompact(e.target.checked)}
            />
            Vista compacta
          </label>
        </div>
      </div>

      {/* Filtros detallados (sticky) */}
      <div className="sticky top-0 bg-white z-10 pb-3">
        <div className="grid md:grid-cols-5 gap-3 mb-3">
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
      </div>

      {isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {isError && <pre className="text-red-600">{String(error)}</pre>}

      {/* AGRUPADO POR FECHA */}
      <div className="space-y-4">
        {dateKeys.map((dateKey) => (
          <section key={dateKey} className="rounded-xl overflow-hidden border">
            <div className="bg-sky-600 text-white px-4 py-2 sticky top-[56px]">
              <h2 className="font-semibold">Fecha: {dateKey}</h2>
            </div>

            <div className="p-3 grid gap-3">
              {grouped[dateKey].map((o) => {
                const overdue = isOverdue(o);
                return (
                  <div key={o.id} className={`border rounded p-3 bg-white ${compact ? "py-2" : ""}`}>
                    <div className="flex justify-between flex-wrap gap-2 items-center">
                      <div className="font-semibold truncate">
                        #{o.id} — {o.empresa} {o.excursion ? `• ${o.excursion}` : ""}
                      </div>
                      <div className="flex items-center gap-2">
                        {overdue && (
                          <span className="text-xs px-2 py-1 rounded bg-rose-100 text-rose-700">
                            Atrasado
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${badgeCls[o.estado] || "bg-slate-100 text-slate-800"}`}>
                          {o.estado}
                        </span>
                      </div>
                    </div>

                    {!compact && (
                      <div className="text-sm text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>{o.lugar_entrega || "—"} → {o.lugar_recogida || "—"}</span>
                        <span>{o.pax ? `${o.pax} pax` : "—"}</span>
                        {o.bono && <span>Bono: <code className="px-1 bg-slate-100 rounded">{o.bono}</code></span>}
                        {o.guia && <span>Guía: {o.guia}</span>}
                        {o.tipo_servicio && <span>Tipo: {o.tipo_servicio}</span>}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2 flex-wrap">
                      <button
                        className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                        disabled={o.estado === "entregado" || deliveredMut.isPending}
                        onClick={() => { setSelected(o); setDeliverOpen(true); }}
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
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {(!isLoading && dateKeys.length === 0) && (
        <div className="text-slate-500 mt-6">No hay pedidos para este rango.</div>
      )}

     <button
        type="button"
        aria-label="Crear pedido"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 w-14 h-14 rounded-full bg-[#005dab] text-white text-3xl shadow-lg flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-blue-300"
        onClick={() => setOpenAdd(true)}
      >
        +
      </button>

      {/* Modal crear pedido */}
      <AddOrderModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onCreated={() => {
          setOpenAdd(false);
          qc.invalidateQueries({ queryKey: ["ops-orders"] });
        }}
      />
    </div>
  );
}
