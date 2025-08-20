import React from "react";

const DATE_PRESETS = [
  { key: "any", label: "Any date" },
  { key: "today", label: "Today" },
  { key: "past7", label: "Past 7 days" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
];

export default function CruiseFilters({
  ships,
  selectedDateKey,
  setSelectedDateKey,
  selectedShip,
  setSelectedShip,
  countsByShip,
  showCounts,
  setShowCounts,
  onClearAll,
}) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">Filter</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showCounts}
              onChange={(e) => setShowCounts(e.target.checked)}
              className="size-4 rounded border-slate-300"
            />
            Show counts
          </label>
          <button
            onClick={onClearAll}
            className="text-xs font-medium px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
            title="Clear all filters"
          >
            ✖ Clear all filters
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xs font-medium text-slate-500 mb-1">By service date:</div>
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map(opt => {
            const active = selectedDateKey === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSelectedDateKey(opt.key)}
                className={`px-2.5 py-1.5 rounded-xl text-sm border transition ${
                  active
                    ? "border-[#005dab] text-white bg-[#005dab]"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[#005dab]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium text-slate-500 mb-1">By ship:</div>
        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-auto pr-1">
          <button
            onClick={() => setSelectedShip("")}
            className={`px-2.5 py-1.5 rounded-xl text-sm border transition ${
              selectedShip === ""
                ? "border-[#005dab] text-white bg-[#005dab]"
                : "border-slate-300 bg-white text-slate-700 hover:border-[#005dab]"
            }`}
          >
            All{showCounts ? ` (${countsByShip["__all__"] ?? 0})` : ""}
          </button>

          {ships.map(ship => {
            const active = selectedShip === ship;
            return (
              <button
                key={ship}
                onClick={() => setSelectedShip(ship)}
                className={`px-2.5 py-1.5 rounded-xl text-sm border transition ${
                  active
                    ? "border-[#005dab] text-white bg-[#005dab]"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[#005dab]"
                }`}
              >
                {ship}{showCounts ? ` (${countsByShip[ship] ?? 0})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Active:</span>
        <span className="text-xs px-2 py-1 rounded-lg bg-[#005dab]/10 text-[#005dab]">
          {{
            any: "Any date",
            today: "Today",
            past7: "Past 7 days",
            month: "This month",
            year: "This year",
          }[selectedDateKey] || "Any date"}
        </span>
        <span className="text-xs px-2 py-1 rounded-lg bg-[#f78243]/10 text-[#f78243]">
          {selectedShip || "All ships"}
        </span>
      </div>
    </div>
  );
}
