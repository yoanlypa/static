import { useEffect, useState } from "react";

export default function Cruceros() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/pedidos/cruceros/bulk/", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("access"),
      },
    })
      .then((r) => r.json())
      .then(setRows);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Pedidos · Cruceros</h1>
      <table className="border w-full">
        <thead>
          <tr className="bg-slate-200">
            <th className="p-1">Fecha</th>
            <th className="p-1">Barco</th>
            <th className="p-1">Bus</th>
            <th className="p-1">Excursión</th>
            <th className="p-1">Idioma</th>
            <th className="p-1">PAX</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-slate-50">
              <td className="p-1">{r.service_date}</td>
              <td className="p-1">{r.ship}</td>
              <td className="p-1">{r.sign}</td>
              <td className="p-1">{r.excursion}</td>
              <td className="p-1">{r.language}</td>
              <td className="p-1 text-center">{r.pax}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
