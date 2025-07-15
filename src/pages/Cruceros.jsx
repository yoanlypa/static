import { useEffect, useState } from "react";

// Si definiste VITE_API_URL en tu .env.*, úsalo; en local es proxy /api
const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Cruceros() {
  const [groups, setGroups] = useState({});
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    const jwt = localStorage.getItem("access");

    fetch(`${API_BASE}/api/pedidos/cruceros/bulk/`, {
      headers: {
        Authorization: jwt ? `Bearer ${jwt}` : "",
        Accept: "application/json",
      },
    })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`${r.status} ${r.statusText}\n${text.slice(0,200)}`);
        }
        return r.json();
      })
      .then((rows) => {
        // agrupar por ship + service_date
        const byShip = {};
        rows.forEach((row) => {
          const key = `${row.ship}__${row.service_date}`;
          if (!byShip[key]) {
            byShip[key] = {
              meta: {
                ship: row.ship,
                service_date: row.service_date,
                printing_date: row.printing_date,
                supplier: row.supplier,
                emergency_contact: row.emergency_contact,
              },
              items: [],
            };
          }
          byShip[key].items.push(row);
        });
        setGroups(byShip);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <p className="p-4 text-slate-500">Cargando cruceros…</p>;
  if (error)   return <pre className="p-4 text-red-600">{error}</pre>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Pedidos &middot; Cruceros
      </h1>

      {Object.values(groups).map(({ meta, items }) => (
        <details key={meta.ship + meta.service_date} className="mb-4 border rounded">
          <summary className="cursor-pointer bg-slate-200 px-3 py-2 font-medium flex flex-wrap gap-x-6 gap-y-1">
            <span><strong>Barco:</strong> {meta.ship}</span>
            <span><strong>Fecha servicio:</strong> {meta.service_date}</span>
            <span><strong>Impresión:</strong> {meta.printing_date}</span>
            <span><strong>Proveedor:</strong> {meta.supplier}</span>
            {meta.emergency_contact && (
              <span><strong>Contacto:</strong> {meta.emergency_contact}</span>
            )}
            <span className="ml-auto">
              {items.length} excursión{items.length !== 1 && "es"}
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
      ))}
    </div>
  );
}
