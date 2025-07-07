import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import PedidoFormModal from '../components/PedidoForm';

export default function PedidosList() {
  const [modalOpen, setModalOpen] = useState(false);
  const buttonRef = useRef(null);

  const {
    data: pedidos = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['mis-pedidos'],
    queryFn: async () => (await api.get('/mis-pedidos/')).data,
  });

  const handleCloseModal = (shouldRefetch = false) => {
    setModalOpen(false);
    if (shouldRefetch) refetch();
    buttonRef.current?.focus();
  };

  if (isLoading) return <p className="text-center mt-8">Cargando pedidos...</p>;
  if (isError)
    return (
      <p className="text-center mt-8 text-red-600" aria-live="polite">
        Error al cargar pedidos
      </p>
    );

  return (
    <div className="p-6 relative">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Mis pedidos</h1>

      {pedidos.length === 0 ? (
        <p className="text-gray-600">Aún no has creado ningún pedido.</p>
      ) : (
        <table className="min-w-full bg-white rounded-xl shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Excursión</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Fechas</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id} className="border-t last:border-b-0 hover:bg-blue-50 transition">
                <td className="px-4 py-2 text-sm">{p.id}</td>
                <td className="px-4 py-2 text-sm">{p.excursion}</td>
                <td className="px-4 py-2 text-sm">
                  {p.fecha_inicio} - {p.fecha_fin || '—'}
                </td>
                <td className="px-4 py-2 text-sm capitalize">{p.estado.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        ref={buttonRef}
        onClick={() => setModalOpen(true)}
        className="md:fixed md:bottom-6 md:right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
        aria-label="Nuevo pedido"
      >
        +
      </button>

      {/* NOTA: handleCloseModal enviará true si el formulario realmente guardó algo */}
      <PedidoFormModal isOpen={modalOpen} onClose={handleCloseModal} />
    </div>
  );
}
