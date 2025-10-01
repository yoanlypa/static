// src/pages/Cruceros.jsx
import { useEffect, useMemo, useState } from "react";
import useCruiseFilters from "../hooks/useCruiseFilters.js";
import CruiseFilters from "../components/CruiseFilters.jsx";
import api from "../services/api";

export default function Cruceros() {
  const [rows, setRows] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState(null);

  // Toggle de orden para las FECHAS (asc | desc)
  const [sortDir, setSortDir] = useState("asc");

  // Fetch inicial (usando Axios `api` + refresh automático)
  useEffect(() => {
    let alive = true;
    setLoad(true);

    const ordering =
      sortDir === "asc" ? "updated_at,uploaded_at" : "-updated_at,-uploaded_at";

    api
      .get("pedidos/cruceros/bulk/", { params: { ordering } })
      .then(({ data }) => {
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        const msg = err?.response?.data?.detail || err.message || "Error al cargar";
        setError(msg);
      })
      .finally(() => {
        if (alive) setLoad(false);
      });

    return () => {
      alive = false;
    };
  }, [sortDir]);

  // Filtros (solo fecha)
  const {
    selectedDateKey,
    setSelectedDateKey,
    filtered,
    clearAll,
  } = useCruiseFilters(rows);

  // Agrupar por fecha > barco (seguimos mostrando por barco, pero sin filtro por barco)
  const grouped = useMemo(() => {
    const byDate = {};
    for (const r of filtered) {
      const dKey = r.service_date || "—";
      const sKey = r.ship || "—";
      byDate[dKey] ??= {};
      byDate[dKey][sKey] ??= {
        meta: {
          printing_date: r.printing_date,
          supplier: r.supplier,
          emergency_contact: r.emergency_contact,
          status: r.status,
          terminal: r.terminal,
        },
        items: [],
      };
      byDate[dKey][sKey].items.push(r);
    }
    // Orden interno por sign numérico ASC (robusto)
    Object.values(byDate).forEach((byShip) => {
      Object.values(byShip).forEach((group) => {
        group.items.sort(
          (a, b) => (parseInt(a.sign, 10) || 0) - (parseInt(b.sign, 10) || 0)
        );
      });
    });
    return byDate;
  }, [filtered]);

  // Lista de fechas según el toggle asc/desc
  const dateKeys = useMemo(
    () =>
      Object.keys(grouped).sort((a, b) =>
        sortDir === "asc" ? a.localeCompare(b) : b.localeCompare(a)
      ),
    [grouped, sortDir]
  );

  if (loading) return <p className="p-4">Cargando…</p>;
  if (error) return <pre className="p-4 text-red-600">{error}</pre>;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center mb-2">Pedidos · Cruceros</h1>

      {/* Filtros (solo fecha) */}
      <CruiseFilters
        selectedDateKey={selectedDateKey}
        setSelectedDateKey={setSelectedDateKey}
        onClearAll={clearAll}
      />

      {/* Resumen + Sort toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <span className="text-sm text-slate-600">
          Showing <b>{filtered.length}</b> records
        </span>

        <div className="flex items-center gap-3">
          {/* Toggle de orden de fechas */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Sort by:</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setSortDir("asc")}
                aria-pressed={sortDir === "asc"}
                className={`px-2.5 py-1 text-xs font-medium ${
                  sortDir === "asc"
                    ? "bg-[#005dab] text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Ascendente
              </button>
              <button
                type="button"
                onClick={() => setSortDir("desc")}
                aria-pressed={sortDir === "desc"}
                className={`px-2.5 py-1 text-xs font-medium border-l border-slate-300 ${
                  sortDir === "desc"
                    ? "bg-[#005dab] text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Descendente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas agrupadas por fecha → barco (visual, sin filtro por barco) */}
      {dateKeys.map((date) => (
        <div key={date} className="bg-white rounded-xl shadow">
          <div className="bg-sky-600 text-white px-4 py-2 rounded-t-xl">
            <h2 className="text-lg font-semibold">Fecha de servicio: {date}</h2>
          </div>

          <div className="p-4">
            {Object.entries(grouped[date]).map(([ship, data]) => {
              const items = [...data.items].sort(
                (a, b) => (parseInt(a.sign, 10) || 0) - (parseInt(b.sign, 10) || 0)
              );
              const totalPax = items.reduce((a, b) => a + (b.pax || 0), 0);

              return (
                <details key={ship} className="mb-4 border rounded">
                  <summary className="cursor-pointer bg-slate-200 px-3 py-2 font-medium flex flex-wrap gap-x-6 gap-y-1">
                    <span>
                      <strong>Barco:</strong> {ship}
                    </span>
                    <span>
                      <strong>Estado:</strong> {data.meta.status}
                    </span>
                    <span>
                      <strong>Terminal:</strong> {data.meta.terminal}
                    </span>
                    <span>
                      <strong>Impresión:</strong> {data.meta.printing_date}
                    </span>
                    <span>
                      <strong>Proveedor:</strong> {data.meta.supplier}
                    </span>
                    {data.meta.emergency_contact && (
                      <span>
                        <strong>Contacto:</strong> {data.meta.emergency_contact}
                      </span>
                    )}
                    <span className="ml-auto">
                      {items.length} exc · {totalPax} pax
                    </span>
                  </summary>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-left">
                        <th className="p-2">Bus</th>
                        <th className="p-2">Excursión</th>
                        <th className="p-2">Idioma</th>
                        <th className="p-2 text-center">PAX</th>
                        <th className="p-2">Hora</th>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
