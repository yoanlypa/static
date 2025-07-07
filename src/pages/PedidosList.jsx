import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import PedidoFormModal from './components/PedidoForm';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

export default function PedidosList() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data: pedidos = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Pedido[]>({
    queryKey: ['mis-pedidos'],
    queryFn: () => api.get('/mis-pedidos/').then(r => r.data),
  });

  const handleClose = (changed = false) => {
    setModalOpen(false);
    if (changed) refetch();
    btnRef.current?.focus();          // accesibilidad
  };

  if (isLoading) return <PedidosSkeleton rows={3} />;
  if (isError) return <p className="text-center mt-8 text-red-600" aria-live="polite">Error al cargar pedidos</p>;

  return (
    <div className="p-6 relative">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Mis pedidos</h1>

      {pedidos.length === 0 ? (
        <p className="text-gray-600">Aún no has creado ningún pedido.</p>
      ) : (
        <PedidosTable pedidos={pedidos} />
      )}

      <button
        ref={btnRef}
        onClick={() => setModalOpen(true)}
        className="md:fixed md:bottom-6 md:right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
        aria-label="Nuevo pedido"
      >
        +
      </button>

      <PedidoFormModal isOpen={modalOpen} onClose={handleClose} />
    </div>
  );
}
