// src/pages/PedidosList.jsx
import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

function normalizePedidos(raw) {
  if (raw && Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return [];
}

function fmtDayMonth(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }); // ej: 05 oct
}

export default function PedidosList() {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const buttonRef = useRef(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mis-pedidos'],
    queryFn: async () => (await api.get('/mis-pedidos/')).data,
  });

  const pedidos = useMemo(() => normalizePedidos(data).filter(p => p.tipo_servicio !== 'crucero'), [data]);

  const handleCloseModal = (changed = false) => {
    setModalOpen(false);
    if (changed) refetch();
    buttonRef.current?.focus();
  };

  if (isLoading) return <p className="text-center mt-8">Cargando pedidos...</p>;
  if (isError) return <p className="text-center mt-8 text-red-600">Error al cargar pedidos</p>;

  return (
    <div className="p-6 relative">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Mis pedidos</h1>

      {pedidos.length === 0 ? (
        <p className="text-gray-600">Aún no has creado ningún pedido.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                {/* Quitamos ID */}
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Excursión</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Empresa</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Fechas</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Tipo</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">PAX</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Bono</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Guía</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Ruta</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Notas</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-t last:border-b-0 hover:bg-blue-50 transition">
                  <td className="px-4 py-2 text-sm">{p.excursion || '—'}</td>
                  <td className="px-4 py-2 text-sm">{p.empresa ?? '—'}</td>
                  <td className="px-4 py-2 text-sm whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100">{fmtDayMonth(p.fecha_inicio)}</span>
                      <span>→</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100">
                        {p.fecha_fin ? fmtDayMonth(p.fecha_fin) : '—'}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{p.tipo_servicio || '—'}</td>
                  <td className="px-4 py-2 text-sm capitalize">{(p.estado ?? '').replace('_', ' ')}</td>
                  <td className="px-4 py-2 text-sm">{p.pax ?? '—'}</td>
                  <td className="px-4 py-2 text-sm">{p.bono || '—'}</td>
                  <td className="px-4 py-2 text-sm">{p.guia || '—'}</td>
                  <td className="px-4 py-2 text-sm">
                    {(p.lugar_entrega || '—') + ' → ' + (p.lugar_recogida || '—')}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {p.notas ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                        onClick={() => { setNotesText(p.notas); setNotesOpen(true); }}
                        title="Ver notas"
                      >
                        📝 Ver
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Botón flotante “nuevo” (si mantienes el modal antiguo, déjalo; si no, quítalo) */}
      {/* <button
        ref={buttonRef}
        onClick={() => setModalOpen(true)}
        className="md:fixed md:bottom-6 md:right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
        aria-label="Nuevo pedido"
      >
        +
      </button>
      <PedidoFormModal isOpen={modalOpen} onClose={(changed)=>{ setModalOpen(false); if(changed) refetch(); }} /> */}

      {/* Modal simple para notas */}
      {notesOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow max-w-lg w-full">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">Notas</h3>
              <button onClick={() => setNotesOpen(false)} className="text-slate-500 text-xl">×</button>
            </div>
            <div className="p-4 whitespace-pre-wrap text-sm">{notesText}</div>
            <div className="px-4 py-3 border-t text-right">
              <button onClick={() => setNotesOpen(false)} className="px-4 py-2 rounded border">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
