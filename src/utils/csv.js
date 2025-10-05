// src/utils/csv.js
export function toCsv(rows, headers) {
  const escape = (v) => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const head = headers.map((h) => h.label).join(",");
  const body = rows
    .map((r) => headers.map((h) => escape(h.get(r))).join(","))
    .join("\n");

  return `${head}\n${body}`;
}

export function downloadCsv(filename, csvString) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
