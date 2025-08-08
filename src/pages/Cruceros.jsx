import { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Cruceros() {
  const [groupsByDate, setGroups] = useState({});
  const [loading, setLoad]        = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    const jwt = localStorage.getItem("access");
    fetch(`${API_BASE}/api/pedidos/cruceros/bulk/?ordering=-updated_at,-uploaded_at`, {
      headers: { Authorization: jwt ? `Bearer ${jwt}` : "" },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((rows) => {
        // agrupar: fecha -> barco -> datos
        const byDate = {};
        rows.forEach((r) => {
          const dKey = r.service_date;
          if (!byDate[dKey]) byDate[dKey] = {};
          const sKey = r.ship;
          if (!byDate[dKey][sKey]) {
            byDate[dKey][sKey] = {
              meta: {
                printing_date: r.printing_date,
                supplier: r.supplier,
                emergency_contact: r.emergency_contact,
                status: r.status,
                terminal: r.terminal,
              },
              items: [],
            };
          }
          byDate[dKey][sKey].items.push(r);
        });
        setGroups(byDate);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <p className="p-4">Cargando…</p>;
  if (error)   return <pre className="p-4 text-red-600">{error}</pre>;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Pedidos · Cruceros</h1>

      {Object.keys(groupsByDate).sort().map((date) => (
        <div key={date} className="bg-white rounded-xl shadow">
          <div className="bg-sky-600 text-white px-4 py-2 rounded-t-xl">
            <h2 className="text-lg font-semibold">Fecha de servicio: {date}</h2>
          </div>

          <div className="p-4">
            {Object.entries(groupsByDate[date]).map(([ship, data]) => {
              const totalPax = data.items.reduce((a, b) => a + b.pax, 0);
              // ordenar por sign numérico
              const items = [...data.items].sort(
                (a, b) => parseInt(a.sign) - parseInt(b.sign)
              );
              return (
                <details key={ship} className="mb-4 border rounded">
                  <summary className="cursor-pointer bg-slate-200 px-3 py-2 font-medium flex flex-wrap gap-x-6 gap-y-1">
                    <span><strong>Barco:</strong> {ship}</span>
                    <span><strong>Estado:</strong> {data.meta.status}</span>
                    <span><strong>Terminal:</strong> {data.meta.terminal}</span>
                    <span><strong>Impresión:</strong> {data.meta.printing_date}</span>
                    <span><strong>Proveedor:</strong> {data.meta.supplier}</span>
                    {data.meta.emergency_contact && (
                      <span><strong>Contacto:</strong> {data.meta.emergency_contact}</span>
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
                        <tr key={i} className="odd:bg-slate-50">
                          <td className="p-2">{r.sign}</td>
                          <td className="p-2">{r.excursion}</td>
                          <td className="p-2">{r.language}</td>
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
