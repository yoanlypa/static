// src/components/DeliverModal.jsx
import { useState } from "react";

export default function DeliverModal({ open, onClose, onConfirm, pedido }) {
  const [qty, setQty] = useState(pedido?.pax ?? "");
  const [override, setOverride] = useState(false);

  if (!open) return null;

  const inputCls = "w-full border rounded p-3 text-base";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md sm:h-auto h-[60dvh] bg-white rounded-t-2xl sm:rounded-xl shadow-lg flex flex-col">
        <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
          <h3 className="text-lg font-semibold">Marcar como entregado</h3>
          <button className="text-slate-500 hover:text-slate-800 text-xl" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            <div className="text-sm text-slate-600">
              Pedido <b>#{pedido?.id}</b> — {pedido?.empresa} {pedido?.excursion ? `• ${pedido?.excursion}` : ""}
            </div>

            <label className="text-sm">
              ¿Con cuántas unidades se entregó finalmente?
              <input
                type="number"
                className={inputCls}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                min={0}
                inputMode="numeric"
                placeholder="Ej: 42"
                autoFocus
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={override}
                onChange={(e) => setOverride(e.target.checked)}
              />
              Actualizar PAX del pedido con este valor
            </label>

            <p className="text-xs text-slate-500">
              Esta cantidad se registrará en el histórico del pedido. Si marcas la casilla, también se actualizará el campo PAX del pedido.
            </p>
          </div>
        </div>

        <div className="px-4 py-3 border-t bg-white flex justify-end gap-2">
          <button className="px-4 py-3 rounded border text-base" onClick={onClose}>Cancelar</button>
          <button
            className="px-4 py-3 rounded bg-emerald-600 text-white text-base disabled:opacity-50"
            onClick={() => onConfirm({ delivered_pax: qty ? Number(qty) : null, override_pax: override })}
          >
            Guardar y entregar
          </button>
        </div>
      </div>
    </div>
  );
}
