import React from "react";
import { Link } from "react-router-dom";
import { Tag, ArrowRight } from "lucide-react";

export default function CategoryCard({ category, isSelected, onSelect }) {
  const handleClick = (e) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(category.slug);
    }
  };

  return (
    <Link
      to={`/shop?category=${encodeURIComponent(category.slug)}`}
      onClick={handleClick}
      className={`group relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-200 bg-white hover:shadow-lg ${
        isSelected
          ? "border-indigo-600 ring-2 ring-indigo-600/20 shadow-indigo-600/10"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="space-y-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600"
          }`}
        >
          <Tag className="w-5 h-5" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 mt-4">
        <span>Browse Products</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
