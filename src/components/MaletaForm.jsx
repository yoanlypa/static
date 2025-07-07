// ✅ MaletaForm.jsx
import React, { useEffect, useState } from 'react';

export default function MaletaForm({
  id,
  index,
  tipoServicio,
  datosGenerales,
  aplicarGeneral,
  onRemove,
  onChange,
}) {
  const [maleta, setMaleta] = useState({
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
    bono: '',
    notas: ''
  });

  useEffect(() => {
    const nuevaMaleta = { ...maleta };
    Object.keys(datosGenerales).forEach((key) => {
      if (aplicarGeneral[key]) {
        nuevaMaleta[key] = datosGenerales[key];
      }
    });
    setMaleta(nuevaMaleta);
  }, [datosGenerales, aplicarGeneral]);

  useEffect(() => {
    if (onChange) {
      onChange(maleta);
    }
  }, [maleta, onChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMaleta((prev) => ({ ...prev, [name]: value }));
  };

  const isHoraVisible = tipoServicio === 'medioDia';

  return (
    <div className="border p-4 rounded bg-white shadow mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-primary">Maleta {index}</h3>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          ✖ Eliminar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(maleta).map(([key, value]) => {
          if (["bono", "notas"].includes(key)) return null;

          const label = key.replace(/([A-Z])/g, ' $1');
          const type = key.includes("fecha") ? "date" : key.includes("hora") ? "time" : "text";
          const shouldShow = !(key.includes("hora") && !isHoraVisible);

          return shouldShow ? (
            <div key={key} className="flex flex-col">
              <label htmlFor={`${key}-${id}`} className="text-sm text-gray-600 mb-1 capitalize">
                {label}
              </label>
              <input
                id={`${key}-${id}`}
                name={key}
                type={type}
                value={value}
                onChange={handleChange}
                className="border rounded px-3 py-2"
              />
            </div>
          ) : null;
        })}

        <div className="flex flex-col md:col-span-2">
          <label htmlFor={`bono-${id}`} className="text-sm text-gray-600 mb-1">Bono</label>
          <input
            id={`bono-${id}`}
            name="bono"
            type="text"
            value={maleta.bono}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label htmlFor={`notas-${id}`} className="text-sm text-gray-600 mb-1">Notas</label>
          <textarea
            id={`notas-${id}`}
            name="notas"
            value={maleta.notas}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>
    </div>
  );
}
