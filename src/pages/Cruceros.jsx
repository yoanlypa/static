import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || ""; // usa .env si lo defines

export default function Cruceros() {
  const [rows, setRows]     = useState([]);
  const [error, setError]   = useState(null);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    const jwt = localStorage.getItem("access");   // tu token

    fetch(`${API_BASE}/api/pedidos/cruceros/bulk/`, {
      headers: {
        "Authorization": jwt ? `Bearer ${jwt}` : "",
        "Accept": "application/json",
      },
    })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`${r.status} ${r.statusText}\n${text.slice(0,200)}`);
        }
        return r.json();
      })
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <p className="p-4 text-slate-500">Cargando cruceros…</p>;
  if (error)   return <pre className="p-4 text-red-600">{error}</pre>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pedidos · Cruceros</h1>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-slate-200 text-left">
            <th className="p-2">Fecha</th>
            <th className="p-2">Barco</th>
            <th className="p-2">Bus</th>
            <th className="p-2">Excursión</th>
            <th className="p-2">Idioma</th>
            <th className="p-2 text-center">PAX</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i} className="odd:bg-slate-50">
              <td className="p-2">{r.service_date}</td>
              <td className="p-2">{r.ship}</td>
              <td className="p-2">{r.sign}</td>
              <td className="p-2">{r.excursion}</td>
              <td className="p-2">{r.language}</td>
              <td className="p-2 text-center">{r.pax}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
