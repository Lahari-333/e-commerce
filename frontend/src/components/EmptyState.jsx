import React from "react";
import { PackageOpen } from "lucide-react";

export default function EmptyState({
  title = "No products found",
  message = "Try changing your search keywords or removing active category filters.",
  actionLabel = null,
  onAction = null,
}) {
  return (
    <div className="py-16 px-4 text-center bg-white border border-slate-200 rounded-2xl max-w-md mx-auto space-y-4 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
        <PackageOpen className="w-7 h-7 stroke-1.5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          {message}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
