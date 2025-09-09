// src/pages/Cruceros.jsx
import { useEffect, useMemo, useState } from "react";
import useCruiseFilters from "../hooks/useCruiseFilters.js";
import CruiseFilters from "../components/CruiseFilters.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Cruceros() {
  const [rows, setRows]   = useState([]);
  const [loading, setLd]  = useState(true);
  const [error, setErr]   = useState(null);
  const [debug, setDebug] = useState(null);

  // Toggle de orden (fechas)
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  // Fetch inicial
  useEffect(() => {
    (async () => {
      try {
        const jwt = localStorage.getItem("access");
        const url = `${API_BASE}/api/pedidos/cruceros/bulk/?ordering=-updated_at,-uploaded_at`;
        const res = await fetch(url, { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
        if (!res.ok) {
          const txt = await res.text();
          setErr(`HTTP ${res.status} · ${res.statusText}`);
          setDebug(txt?.slice(0, 500));
          setRows([]);
          return;
        }
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(String(e));
        setRows([]);
      } finally {
        setLd(false);
      }
    })();
  }, []);

  // Filtros
  const {
    ships,
    selectedDateKey, setSelectedDateKey,
    selectedShip, setSelectedShip,
    showCounts, setShowCounts,
    countsByShip,
    filtered,
    clearAll,
  } = useCruiseFilters(rows);

  // Agrupar por fecha > barco
  const grouped = useMemo(() => {
    const byDate = {};
    for (const r of filtered) {
      const dKey = r.service_date || "—";
      const sKey = r.ship || "—";
      byDate[dKey] ??= {};
      byDate[dKey][sKey] ??= { meta: {}, items: [] };
      byDate[dKey][sKey].items.push(r);
    }
    // Orden interno por sign numérico ASC
    Object.values(byDate).forEach(byShip => {
      Object.values(byShip).forEach(group => {
        group.items.sort((a, b) => (parseInt(a.sign) || 0) - (parseInt(b.sign) || 0));
      });
    });
    return byDate;
  }, [filtered]);

  // 🔧 Claves de fecha (usa SIEMPRE 'dateKeys')
  const dateKeys = useMemo(
    () =>
      Object.keys(grouped).sort((a, b) =>
        sortDir === "asc" ? a.localeCompare(b) : b.localeCompare(a)
      ),
    [grouped, sortDir]
  );

  if (loading) return <p className="p-4">Cargando…</p>;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Pedidos · Cruceros</h1>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <div className="font-semibold">Error cargando pedidos</div>
          <div>{error}</div>
          {debug && <pre className="mt-2 whitespace-pre-wrap">{debug}</pre>}
        </div>
      )}

      <CruiseFilters
        ships={ships}
        selectedDateKey={selectedDateKey}
        setSelectedDateKey={setSelectedDateKey}
        selectedShip={selectedShip}
        setSelectedShip={setSelectedShip}
        countsByShip={countsByShip}
        showCounts={showCounts}
        setShowCounts={setShowCounts}
        onClearAll={clearAll}
      />

      {/* Resumen + Sort toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <span className="text-sm text-slate-600">
          Showing <b>{filtered.length}</b> records
        </span>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Sort by:</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setSortDir("asc")}
                aria-pressed={sortDir === "asc"}
                className={`px-2.5 py-1 text-xs font-medium ${
                  sortDir === "asc" ? "bg-[#005dab] text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Ascendente
              </button>
              <button
                type="button"
                onClick={() => setSortDir("desc")}
                aria-pressed={sortDir === "desc"}
                className={`px-2.5 py-1 text-xs font-medium border-l border-slate-300 ${
                  sortDir === "desc" ? "bg-[#005dab] text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Descendente
              </button>
            </div>
          </div>

          <span className="text-xs px-2 py-1 rounded-lg bg-[#005dab]/10 text-[#005dab]">
            {selectedShip || "All ships"}
          </span>
        </div>
      </div>

      {/* Lista por fechas */}
      {dateKeys.length === 0 && !error && (
        <div className="rounded-lg border p-4 text-sm text-slate-600">
          No hay resultados con los filtros actuales.{" "}
          <button onClick={clearAll} className="underline">Limpiar filtros</button>
        </div>
      )}

      {dateKeys.map((dateKey) => {
        const shipsMap = grouped[dateKey];
        const shipKeys = Object.keys(shipsMap).sort((a, b) => a.localeCompare(b));
        return (
          <div key={dateKey} className="bg-white rounded-xl shadow border">
            <div className="bg-sky-600 text-white px-4 py-2 rounded-t-xl">
              <h2 className="text-lg font-semibold">Fecha de servicio: {dateKey}</h2>
            </div>

            <div className="p-4">
              {shipKeys.map((ship) => {
                const items = shipsMap[ship].items;
                const totalPax = items.reduce((a, b) => a + (b.pax || 0), 0);
                return (
                  <details key={ship} className="mb-4 border rounded">
                    <summary className="cursor-pointer bg-slate-100 px-3 py-2 font-medium flex flex-wrap gap-x-6 gap-y-1">
                      <span><strong>Barco:</strong> {ship}</span>
                      <span className="ml-auto">{items.length} exc · {totalPax} pax</span>
                    </summary>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="p-2">Bus</th>
                          <th className="p-2">Excursión</th>
                          <th className="p-2">Idioma</th>
                          <th className="p-2 text-center">PAX</th>
                          <th className="p-2">Hora</th>
                          <th className="p-2">Estado</th>
                          <th className="p-2">Terminal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((r, i) => (
                          <tr key={`${r.sign}-${i}`} className="odd:bg-slate-50">
                            <td className="p-2">{r.sign}</td>
                            <td className="p-2">{r.excursion}</td>
                            <td className="p-2">{r.language || "—"}</td>
                            <td className="p-2 text-center">{r.pax}</td>
                            <td className="p-2">{r.arrival_time ?? "—"}</td>
                            <td className="p-2">{r.status || "—"}</td>
                            <td className="p-2">{r.terminal || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
