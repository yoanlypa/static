export function parseDRFError(err) {
  const res = err?.response;
  if (!res) return { detail: "Error de red" };
  const data = res.data || {};
  if (typeof data === "string") return { detail: data };
  const flat = {};
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) flat[k] = v.join(" ");
    else if (typeof v === "string") flat[k] = v;
    else flat[k] = JSON.stringify(v);
  }
  return flat;
}
