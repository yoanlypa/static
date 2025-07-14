import { useEffect, useState } from "react";

function Cruceros() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pedidos/cruceros/bulk/", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("access"), // tu JWT guardado
      },
    })
      .then((r) => r.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <p className="p-4 text-slate-500">Cargando cruceros…</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pedidos · Cruceros</h1>
      <table className="w-full border">
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
          {rows.map((r, i) => (
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

export default Cruceros;
