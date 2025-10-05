// src/utils/pedidoNormalize.js
export function onlyDate(value) {
  if (!value) return value;
  if (typeof value !== "string") return value;
  const v = value.trim();
  if (v.includes("T")) return v.split("T", 1)[0];
  if (v.includes(" ")) return v.split(" ", 1)[0];
  return v; // ya viene YYYY-MM-DD
}

// Tu modelo espera: mediodia | dia_Completo | circuito | crucero
const TIPO_UI_TO_API = {
  dia_completo: "dia_Completo",
  mediodia: "mediodia",
  circuito: "circuito",
  crucero: "crucero",
};

export function mapTipoServicio(uiValue) {
  if (!uiValue) return uiValue;
  // si ya viene igual que el modelo, respétalo
  if (["mediodia", "dia_Completo", "circuito", "crucero"].includes(uiValue)) return uiValue;
  return TIPO_UI_TO_API[uiValue] ?? uiValue;
}

/**
 * Normaliza el payload antes de POST /ops/pedidos/
 * - fechas a YYYY-MM-DD
 * - tipo_servicio al valor exacto del modelo
 * - emisores/pax a enteros o los elimina si vacíos
 */
export function normalizePedidoPayload(input) {
  const out = { ...input };

  // Fechas solo date
  if (out.fecha_inicio) out.fecha_inicio = onlyDate(out.fecha_inicio);
  if (out.fecha_fin) out.fecha_fin = onlyDate(out.fecha_fin);

  // Tipo de servicio a lo que espera el modelo
  out.tipo_servicio = mapTipoServicio(out.tipo_servicio);

  // Enteros
  if (out.pax !== undefined && out.pax !== null && out.pax !== "") {
    const n = Number(out.pax);
    if (!Number.isNaN(n)) out.pax = n;
  }

  if (out.emisores === "" || out.emisores === null || out.emisores === undefined) {
    delete out.emisores; // opcional, evita "A valid integer is required"
  } else {
    const e = Number(out.emisores);
    if (Number.isNaN(e)) delete out.emisores;
    else out.emisores = e;
  }

  return out;
}
