import { useMemo, useState } from "react";

function parseISODateUTC(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function isSameUTCDate(a, b) {
  return a && b &&
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();
}
function inLastDays(base, target, days) {
  if (!base || !target) return false;
  const ms = base - target;
  return ms >= 0 && ms <= days * 24 * 60 * 60 * 1000;
}
function isThisMonth(base, target) {
  return base && target &&
    base.getUTCFullYear() === target.getUTCFullYear() &&
    base.getUTCMonth() === target.getUTCMonth();
}
function isThisYear(base, target) {
  return base && target && base.getUTCFullYear() === target.getUTCFullYear();
}

function applyDatePreset(rows, key) {
  if (key === "any") return rows;
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return rows.filter(r => {
    const d = parseISODateUTC(r.service_date);
    if (!d) return false;
    switch (key) {
      case "today": return isSameUTCDate(todayUTC, d);
      case "past7": return inLastDays(todayUTC, d, 7);
      case "month": return isThisMonth(todayUTC, d);
      case "year":  return isThisYear(todayUTC, d);
      default: return true;
    }
  });
}

export default function useCruiseFilters(rows) {
  const [selectedDateKey, setSelectedDateKey] = useState("any");

  // solo filtramos por fecha (sin filtro de barco)
  const filtered = useMemo(
    () => applyDatePreset(rows, selectedDateKey),
    [rows, selectedDateKey]
  );

  const clearAll = () => setSelectedDateKey("any");

  return {
    selectedDateKey, setSelectedDateKey,
    filtered,
    clearAll,
  };
}
