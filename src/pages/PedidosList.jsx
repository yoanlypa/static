// src/pages/PedidosList.jsx
import { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import PedidoFormModal from "../components/PedidoFormModal";

function normalizePedidos(raw) {
  if (raw && Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return [];
}

function fmtDate(d) {
  if (!d) return "—";
  // admite "YYYY-MM-DD" o "YYYY-MM-DDTHH:MM:SSZ"
  const s = String(d);
  return s.includes("T") ? s.slice(0, 10) : s;
}

function fmtDateTime(d) {
  if (!d) return "—";
  const s = String(d).replace("T", " ");
  return s.length > 16 ? s.slice(0, 16) : s;
}

const estadoBadge = {
  pendiente_pago: "bg-amber-100 text-amber-800",
  pagado: "bg-emerald-100 text-emerald-800",
  aprobado: "bg-sky-100 text-sky-800",
  entregado: "bg-indigo-100 text-indigo-800",
  recogido: "bg-slate-200 text-slate-800",
};

export default function PedidosList() {
  const [modalOpen, setModalOpen] = useState(false);
  const buttonRef = useRef(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mis-pedidos"],
    queryFn: async () => (await api.get("/mis-pedidos/")).data,
    refetchOnWindowFocus: false,
  });

  const pedidos = useMemo(() => {
    const arr = normalizePedidos(data);
    // seguridad extra: no mostrar cruceros en "mis pedidos" (sólo estándar)
    return arr.filter((p) => (p?.tipo_servicio || "") !== "crucero");
  }, [data]);

  const handleCloseModal = (changed = false) => {
    setModalOpen(false);
    if (changed) refetch();
    buttonRef.current?.focus();
  };

  if (isLoading) return <p className="text-center mt-8">Cargando pedidos...</p>;
  if (isError) return <p className="text-center mt-8 text-red-600">Error al cargar pedidos</p>;

  return (
    <div className="p-6 relative max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Mis pedidos</h1>

      {pedidos.length === 0 ? (
        <p className="text-gray-600">Aún no has creado ningún pedido estándar.</p>
      ) : (
        <>
          {/* Tabla (≥ md) */}
          <div className="hidden md:block">
            <table className="min-w-full bg-white rounded-xl shadow overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">ID</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Empresa</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Excursión</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Tipo</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Fechas</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">PAX</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Bono</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Guía</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Entrega → Recogida</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} className="border-t last:border-b-0 hover:bg-blue-50 transition">
                    <td className="px-4 py-2 text-sm">{p.id}</td>
                    {/* empresa_nombre si existe (lo añadimos en el serializer), si no, el ID */}
                    <td className="px-4 py-2 text-sm">{p.empresa_nombre || p.empresa || "—"}</td>
                    <td className="px-4 py-2 text-sm">{p.excursion || "—"}</td>
                    <td className="px-4 py-2 text-sm">{p.tipo_servicio || "—"}</td>
                    <td className="px-4 py-2 text-sm">
                      {fmtDate(p.fecha_inicio)} — {fmtDate(p.fecha_fin)}
                    </td>
                    <td className="px-4 py-2 text-sm">{p.pax ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{p.bono || "—"}</td>
                    <td className="px-4 py-2 text-sm">{p.guia || "—"}</td>
                    <td className="px-4 py-2 text-sm">
                      {(p.lugar_entrega || "—") + " → " + (p.lugar_recogida || "—")}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={
                          "px-2 py-1 rounded text-xs " +
                          (estadoBadge[p.estado] || "bg-slate-100 text-slate-800")
                        }
                      >
                        {(p.estado || "").replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bloque de notas y auditoría debajo (tabla no es ideal para texto largo) */}
            <div className="mt-4 grid grid-cols-1 gap-3">
              {pedidos.map((p) => (
                <div key={`notes-${p.id}`} className="bg-white border rounded-xl p-3">
                  <div className="text-sm text-slate-500 mb-1">Pedido #{p.id} — Notas</div>
                  <pre className="whitespace-pre-wrap text-sm p-2 bg-slate-50 rounded border">
                    {p.notas || "—"}
                  </pre>
                  <div className="grid md:grid-cols-2 gap-2 text-xs text-slate-500 mt-2">
                    <div>Creado: {fmtDateTime(p.fecha_creacion)}</div>
                    <div>Modificado: {fmtDateTime(p.fecha_modificacion)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjetas (móvil < md) */}
          <div className="md:hidden grid gap-3">
            {pedidos.map((p) => (
              <div key={p.id} className="border rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">
                    #{p.id} · {p.empresa_nombre || p.empresa || "—"}
                    {p.excursion ? ` • ${p.excursion}` : ""}
                  </div>
                  <span
                    className={
                      "px-2 py-1 rounded text-xs " +
                      (estadoBadge[p.estado] || "bg-slate-100 text-slate-800")
                    }
                  >
                    {(p.estado || "").replace("_", " ")}
                  </span>
                </div>

                <div className="text-sm text-slate-700 mt-2 space-y-1">
                  <div><span className="text-slate-500">Tipo: </span>{p.tipo_servicio || "—"}</div>
                  <div>
                    <span className="text-slate-500">Fechas: </span>
                    {fmtDate(p.fecha_inicio)} — {fmtDate(p.fecha_fin)}
                  </div>
                  <div><span className="text-slate-500">PAX: </span>{p.pax ?? "—"}</div>
                  <div><span className="text-slate-500">Bono: </span>{p.bono || "—"}</div>
                  <div><span className="text-slate-500">Guía: </span>{p.guia || "—"}</div>
                  <div>
                    <span className="text-slate-500">Entrega → Recogida: </span>
                    {(p.lugar_entrega || "—") + " → " + (p.lugar_recogida || "—")}
                  </div>
                </div>

                {p.notas ? (
                  <div className="mt-2">
                    <div className="text-slate-500 text-xs mb-1">Notas</div>
                    <pre className="whitespace-pre-wrap text-sm p-2 bg-slate-50 rounded border">
                      {p.notas}
                    </pre>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-2">
                  <div>Creado: {fmtDateTime(p.fecha_creacion)}</div>
                  <div>Modificado: {fmtDateTime(p.fecha_modificacion)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Botón flotante para crear */}
      <button
        ref={buttonRef}
        onClick={() => setModalOpen(true)}
        className="md:fixed md:bottom-6 md:right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
        aria-label="Nuevo pedido"
        title="Nuevo pedido"
      >
        +
      </button>

      <PedidoFormModal isOpen={modalOpen} onClose={handleCloseModal} />
    </div>
  );
}
