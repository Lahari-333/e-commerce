import React, { useState, useEffect } from "react";
import { ArrowRight, RotateCcw, AlertCircle } from "lucide-react";

const PRESETS = [
  { label: "Under ₹500", min: "", max: 500 },
  { label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { label: "Above ₹2,500", min: 2500, max: "" },
];

export default function PriceFilter({
  minPrice = "",
  maxPrice = "",
  onApplyPrice,
  onResetPrice,
}) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const [validationError, setValidationError] = useState("");

  // Keep local input fields in sync when external price filter changes
  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
    setValidationError("");
  }, [minPrice, maxPrice]);

  const handleApply = (e) => {
    if (e) e.preventDefault();
    setValidationError("");

    const minNum = localMin !== "" ? Number(localMin) : null;
    const maxNum = localMax !== "" ? Number(localMax) : null;

    if (minNum !== null && minNum < 0) {
      setValidationError("Min price cannot be negative");
      return;
    }
    if (maxNum !== null && maxNum < 0) {
      setValidationError("Max price cannot be negative");
      return;
    }
    if (minNum !== null && maxNum !== null && minNum > maxNum) {
      setValidationError("Min price cannot exceed Max price");
      return;
    }

    onApplyPrice({
      minPrice: localMin !== "" ? localMin : "",
      maxPrice: localMax !== "" ? localMax : "",
    });
  };

  const handlePresetClick = (preset) => {
    setLocalMin(preset.min !== "" ? String(preset.min) : "");
    setLocalMax(preset.max !== "" ? String(preset.max) : "");
    setValidationError("");
    onApplyPrice({
      minPrice: preset.min !== "" ? String(preset.min) : "",
      maxPrice: preset.max !== "" ? String(preset.max) : "",
    });
  };

  const handleReset = () => {
    setLocalMin("");
    setLocalMax("");
    setValidationError("");
    if (onResetPrice) {
      onResetPrice();
    }
  };

  const isPresetActive = (preset) => {
    const currentMinStr = minPrice !== "" ? String(minPrice) : "";
    const currentMaxStr = maxPrice !== "" ? String(maxPrice) : "";
    const pMinStr = preset.min !== "" ? String(preset.min) : "";
    const pMaxStr = preset.max !== "" ? String(preset.max) : "";
    return currentMinStr === pMinStr && currentMaxStr === pMaxStr;
  };

  const hasActivePriceFilter = minPrice !== "" || maxPrice !== "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Price Range (₹)
        </label>
        {hasActivePriceFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-2 gap-1.5">
        {PRESETS.map((preset, idx) => {
          const active = isPresetActive(preset);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-all border ${
                active
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom Inputs */}
      <form onSubmit={handleApply} className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
              ₹
            </span>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <span className="text-slate-400 text-xs font-medium">to</span>

          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
              ₹
            </span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center shrink-0"
            title="Apply custom price filter"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Validation Warning */}
        {validationError && (
          <div className="text-[11px] text-rose-600 flex items-center gap-1 font-medium animate-fade-in">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </form>
    </div>
  );
}
