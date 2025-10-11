import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { remindersApi } from "../services/api";
import ReminderModal from "../components/ReminderModal";

function toISODate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function rangeToday() {
  const d = new Date();
  return { s: `${toISODate(d)}T00:00:00Z`, e: `${toISODate(d)}T23:59:59Z` };
}
function rangeWeek() {
  const d = new Date();
  const day = d.getDay(); // 0 Dom
  const diffToMon = day === 0 ? -6 : 1 - day;
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

export default function Reminders() {
  const [filters, setFilters] = useState(() => {
    const { s, e } = rangeWeek();
    return { date_from: s, date_to: e, q: "", showDone: false };
  });
  const [open, setOpen] = useState(false);

  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: ["reminders", filters],
    queryFn: async () => {
      const { data } = await remindersApi.list({
        date_from: filters.date_from,
        date_to: filters.date_to,
        q: filters.q || undefined,
        include_done: filters.showDone ? "1" : undefined,
      });
      return Array.isArray(data) ? data : (data.results || []);
    },
    refetchOnWindowFocus: false,
  });

  const toggleMut = useMutation({
    mutationFn: (id) => remindersApi.toggleDone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => remindersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const grouped = useMemo(() => {
    const arr = (listQ.data || []).slice().sort((a,b) => String(a.when).localeCompare(String(b.when)));
    const byDay = {};
    for (const r of arr) {
      const k = (r.due_at || "").slice(0,10) || "—";
      (byDay[k] ??= []).push(r);
    }
    return byDay;
  }, [listQ.data]);

  const days = Object.keys(grouped);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header + Acciones */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="text-2xl font-bold">Recordatorios</h1>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 rounded border text-sm" onClick={() => {
            const { s, e } = rangeToday();
            setFilters((f) => ({ ...f, date_from: s, date_to: e }));
          }}>Hoy</button>
          <button className="px-3 py-1.5 rounded border text-sm" onClick={() => {
            const { s, e } = rangeWeek();
            setFilters((f) => ({ ...f, date_from: s, date_to: e }));
          }}>Esta semana</button>
          <button className="px-3 py-1.5 rounded border text-sm" onClick={() => {
            const { s, e } = rangeMonth();
            setFilters((f) => ({ ...f, date_from: s, date_to: e }));
          }}>Este mes</button>

          <label className="ml-2 text-sm inline-flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4"
              checked={filters.showDone}
              onChange={(e)=> setFilters((f)=>({ ...f, showDone: e.target.checked }))}/>
            Mostrar completados
          </label>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <label className="text-sm">
          Desde
          <input
            type="date"
            className="w-full border rounded p-2"
            value={filters.date_from?.slice(0,10) || ""}
            onChange={(e)=> setFilters((f)=>({
              ...f,
              date_from: e.target.value ? `${e.target.value}T00:00:00Z` : "",
            }))}
          />
        </label>
        <label className="text-sm">
          Hasta
          <input
            type="date"
            className="w-full border rounded p-2"
            value={filters.date_to?.slice(0,10) || ""}
            onChange={(e)=> setFilters((f)=>({
              ...f,
              date_to: e.target.value ? `${e.target.value}T23:59:59Z` : "",
            }))}
          />
        </label>
        <label className="text-sm">
          Buscar
          <input
            className="w-full border rounded p-2"
            placeholder="título o notas…"
            value={filters.q}
            onChange={(e)=> setFilters((f)=>({ ...f, q: e.target.value }))}
          />
        </label>
      </div>

      {/* Lista */}
      {listQ.isLoading && <div>Cargando…</div>}
      {listQ.isError && <div className="text-rose-600">No se pudieron cargar los recordatorios.</div>}

      <div className="space-y-4">
        {days.map((d)=>(
          <section key={d} className="rounded-xl overflow-hidden border">
            <div className="bg-sky-600 text-white px-4 py-2 sticky top-[16px]">
              <h2 className="font-semibold">Fecha: {d}</h2>
            </div>
            <div className="p-3 grid gap-2">
              {grouped[d].map((r)=>(
                <div key={r.id} className="border rounded p-3 bg-white flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5"
                      checked={!!r.done}
                      onChange={()=> toggleMut.mutate(r.id)}
                    />
                    <div>
                      <div className={`font-semibold ${r.done ? "line-through text-slate-400" : ""}`}>{r.title}</div>
                      <div className="text-sm text-slate-600">
                        {new Date(r.due_at).toLocaleString()}
                      </div>
                      {r.notes && <div className="text-sm text-slate-700 mt-1">{r.notes}</div>}
                    </div>
                  </div>
                  <button
                    className="text-rose-600 hover:text-rose-800 text-sm"
                    onClick={()=> deleteMut.mutate(r.id)}
                  >
                    Borrar
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {!listQ.isLoading && days.length === 0 && (
        <div className="text-slate-500 mt-6">No hay recordatorios en este rango.</div>
      )}

      {/* Botón flotante + Modal */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full bg-[#005dab] text-white text-3xl leading-none shadow-lg flex items-center justify-center hover:opacity-90"
          aria-label="Nuevo recordatorio"
          title="Nuevo recordatorio"
        >
          +
        </button>
      </div>

      <ReminderModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={() => {
          setOpen(false);
          qc.invalidateQueries({ queryKey: ["reminders"] });
        }}
      />
    </div>
  );
}
