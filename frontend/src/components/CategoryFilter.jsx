import React from "react";
import { Tag } from "lucide-react";

export default function CategoryFilter({
  categories = [],
  selectedCategory = "all",
  onSelectCategory,
  variant = "pills", // "pills" or "list"
}) {
  if (variant === "list") {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors flex items-center justify-between ${
            selectedCategory === "all"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>All Categories</span>
        </button>

        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectCategory(c.slug)}
            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors flex items-center justify-between ${
              selectedCategory === c.slug
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{c.name}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default "pills" display
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        type="button"
        onClick={() => onSelectCategory("all")}
        className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
          selectedCategory === "all"
            ? "bg-indigo-600 text-white shadow-sm"
            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        }`}
      >
        <Tag className="w-3.5 h-3.5" />
        <span>All</span>
      </button>

      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelectCategory(c.slug)}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedCategory === c.slug
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span>{c.name}</span>
        </button>
      ))}
    </div>
  );
}
