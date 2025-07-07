
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Toggle from './Toggle';
import Maleta from './Maleta';

const defaultDatosGenerales = {
  grupo: '',
  excursion: '',
  lugarEntrega: '',
  lugarRecogida: '',
  fechaInicio: '',
  fechaFin: '',
  horaInicio: '',
  horaFin: '',
  guia: '',
  pax: '',
  emisores: '',
};

export default function PedidoFormModal({ isOpen, onClose }) {
  const { register, handleSubmit, getValues } = useForm({
    defaultValues: { datosGenerales: defaultDatosGenerales },
  });
  const [tipoServicio, setTipoServicio] = useState('medioDia');
  const [maletas, setMaletas] = useState([{ id: 1 }]);
  const [aplicarGeneral, setAplicarGeneral] = useState({
    grupo: false,
    excursion: false,
    lugarEntrega: false,
    lugarRecogida: false,
    fechaInicio: false,
    fechaFin: false,
    horaInicio: false,
    horaFin: false,
    guia: false,
    pax: false,
    emisores: false,
  });

  const toggleAplicarGeneral = (field) => {
    setAplicarGeneral((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const addMaleta = () => {
    const nuevaId = maletas.length + 1;
    setMaletas([...maletas, { id: nuevaId }]);
  };

  const removeMaleta = (id) => {
    setMaletas((prev) => prev.filter((m) => m.id !== id));
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        tipoServicio,
        maletas: maletas.map((m, i) => ({
          ...getValues(`maletas[${i}]`),
        })),
      };
      await api.post('/api/pedidos/', payload);
      alert('Pedido guardado exitosamente');
      onClose(true); // ← indica que hubo cambios
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Hubo un error al guardar el pedido');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-700">Nuevo Pedido</h2>
          <button onClick={() => onClose(false)} className="text-red-500 font-bold text-xl">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Datos generales */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-primary mb-2">Datos generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(aplicarGeneral).map((key) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm text-gray-700 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={key.includes('fecha') ? 'date' : key.includes('hora') ? 'time' : 'text'}
                      {...register(`datosGenerales.${key}`)}
                      className="flex-1 px-3 py-2 border rounded input-general"
                    />
                    <Toggle
                      checked={aplicarGeneral[key]}
                      onChange={() => toggleAplicarGeneral(key)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maletas */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between mb-2">
              <h3 className="text-lg font-semibold text-primary">Maletas</h3>
              <button
                type="button"
                onClick={addMaleta}
                className="text-blue-600 hover:underline text-sm"
              >
                + Añadir maleta
              </button>
            </div>
            {maletas.map((maleta, index) => (
              <Maleta
                key={maleta.id}
                id={maleta.id}
                index={index + 1}
                tipoServicio={tipoServicio}
                datosGenerales={getValues('datosGenerales') || defaultDatosGenerales}
                aplicarGeneral={aplicarGeneral}
                onRemove={() => removeMaleta(maleta.id)}
                onChange={(data) => {
                  maleta.datos = data; // opcional: manejar en un estado aparte
                }}
              />
            ))}
          </div>

          <div className="text-right">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Guardar pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
