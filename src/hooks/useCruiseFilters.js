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
  const [selectedShip, setSelectedShip] = useState("");
  const [showCounts, setShowCounts] = useState(true);

  const ships = useMemo(() => {
    const set = new Set(rows.map(r => r.ship).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const dateFiltered = useMemo(
    () => applyDatePreset(rows, selectedDateKey),
    [rows, selectedDateKey]
  );

  const countsByShip = useMemo(() => {
    const c = { "__all__": dateFiltered.length };
    for (const r of dateFiltered) if (r.ship) c[r.ship] = (c[r.ship] || 0) + 1;
    return c;
  }, [dateFiltered]);

  const filtered = useMemo(() => {
    const base = selectedShip ? dateFiltered.filter(r => r.ship === selectedShip) : dateFiltered;
    return [...base].sort((a, b) => {
      if (a.service_date !== b.service_date) return b.service_date.localeCompare(a.service_date);
      if ((a.ship || "") !== (b.ship || "")) return (a.ship || "").localeCompare(b.ship || "");
      const na = parseInt(a.sign, 10), nb = parseInt(b.sign, 10);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return (a.sign || "").localeCompare(b.sign || "");
    });
  }, [dateFiltered, selectedShip]);

  const clearAll = () => { setSelectedDateKey("any"); setSelectedShip(""); };

  return {
    ships,
    selectedDateKey, setSelectedDateKey,
    selectedShip, setSelectedShip,
    showCounts, setShowCounts,
    countsByShip,
    filtered,
    clearAll,
  };
}
