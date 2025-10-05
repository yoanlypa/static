// src/utils/drfErrors.js
export function parseDRFError(err) {
  const data = err?.response?.data;
  if (!data || typeof data !== "object") return { _error: "Error inesperado" };
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = Array.isArray(v) ? v.join(" ") : String(v);
  }
  return out;
}
