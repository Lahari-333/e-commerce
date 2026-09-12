import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ProductGrid from "../components/ProductGrid";
import CategoryFilter from "../components/CategoryFilter";
import PriceFilter from "../components/PriceFilter";
import Pagination from "../components/Pagination";
import { fetchCategories, fetchProductsWithPagination } from "../services/api";
import {
  Filter,
  ArrowUpDown,
  Search,
  ChevronRight,
  X,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Directly derive active filters and pagination from URL query parameters (single source of truth)
  const selectedCategory = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search") || "";
  const featuredOnly = searchParams.get("featured") === "true";
  const sortBy = searchParams.get("sort") || "default";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const currentPage = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    totalProducts: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 12,
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const gridTopRef = useRef(null);

  // Load category list on mount
  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  // Update URL search parameters
  const updateUrl = useCallback(
    (updates = {}) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, val]) => {
        if (
          val === undefined ||
          val === null ||
          val === "" ||
          val === "all" ||
          (key === "page" && Number(val) === 1) ||
          (key === "sort" && val === "default") ||
          (key === "featured" && !val)
        ) {
          next.delete(key);
        } else {
          next.set(key, String(val));
        }
      });

      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  // Fetch products whenever active filters, sort, or page change
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const options = {
          page: currentPage,
          limit: 12,
        };

        if (selectedCategory !== "all") options.category = selectedCategory;
        if (searchQuery.trim()) options.search = searchQuery.trim();
        if (featuredOnly) options.featured = true;
        if (sortBy && sortBy !== "default") options.sort = sortBy;
        if (minPrice !== "") options.minPrice = minPrice;
        if (maxPrice !== "") options.maxPrice = maxPrice;

        const res = await fetchProductsWithPagination(options);

        if (isMounted) {
          setProducts(res.data || []);
          setPagination({
            totalProducts: res.totalProducts || 0,
            totalPages: res.totalPages || 1,
            hasNextPage: Boolean(res.hasNextPage),
            hasPrevPage: Boolean(res.hasPrevPage),
            limit: res.limit || 12,
          });
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load products:", err);
          setError(err.message || "Failed to retrieve catalog items");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery, featuredOnly, sortBy, minPrice, maxPrice, currentPage]);

  // Handlers that reset to page 1 on filter/sort change
  const handleCategorySelect = (slug) => {
    updateUrl({ category: slug, page: 1 });
  };

  const handleSearchInput = (e) => {
    const val = e.target.value;
    updateUrl({ search: val, page: 1 });
  };

  const handleSortChange = (e) => {
    const nextSort = e.target.value;
    updateUrl({ sort: nextSort, page: 1 });
  };

  const handleFeaturedToggle = () => {
    updateUrl({ featured: !featuredOnly, page: 1 });
  };

  const handleApplyPrice = ({ minPrice: nextMin, maxPrice: nextMax }) => {
    updateUrl({ minPrice: nextMin, maxPrice: nextMax, page: 1 });
  };

  const handleResetPrice = () => {
    updateUrl({ minPrice: "", maxPrice: "", page: 1 });
  };

  const handlePageChange = (newPage) => {
    updateUrl({ page: newPage });
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleClearAllFilters = () => {
    setSearchParams({});
  };

  // Count active non-default filters
  const activeFiltersCount = [
    selectedCategory !== "all",
    searchQuery.trim() !== "",
    featuredOnly,
    sortBy !== "default",
    minPrice !== "" || maxPrice !== "",
  ].filter(Boolean).length;

  const filterSidebarContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </span>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </button>
        )}
      </div>

      {/* Categories Filter */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Categories
        </label>
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
          variant="list"
        />
      </div>

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-slate-200">
        <PriceFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          onApplyPrice={handleApplyPrice}
          onResetPrice={handleResetPrice}
        />
      </div>

      {/* Featured Only Filter */}
      <div className="pt-4 border-t border-slate-200">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={handleFeaturedToggle}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          Featured Products Only
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8" ref={gridTopRef}>
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-900">Products</span>
        {selectedCategory !== "all" && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-indigo-600 font-semibold capitalize">
              {selectedCategory}
            </span>
          </>
        )}
      </nav>

      {/* Header and Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover quality products with real-time sorting, price filtering, and pagination.
          </p>
        </div>

        {/* Search, Sort, and Mobile Filter Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => updateUrl({ search: "", page: 1 })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sorting Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full sm:w-auto appearance-none bg-white border border-slate-300 text-slate-700 text-xs font-semibold py-2.5 pl-3 pr-8 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="default">Sort: Relevance / Default</option>
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="rating-desc">Highest Rated</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-24">
            {filterSidebarContent}
          </div>
        </aside>

        {/* Mobile Slide-Over Drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileFiltersOpen(false)}
            />
            {/* Slide-over panel */}
            <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto z-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                    Filters & Options
                  </h2>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {filterSidebarContent}
              </div>

              <div className="pt-6 border-t border-slate-200 mt-8">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors text-center"
                >
                  View Results ({pagination.totalProducts})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-6">
          {/* Active Filter Chips & Result Counter */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {loading ? (
                <span>Loading products...</span>
              ) : (
                <span>
                  Showing{" "}
                  <strong className="text-slate-900">
                    {pagination.totalProducts === 0
                      ? 0
                      : (currentPage - 1) * pagination.limit + 1}
                    –
                    {Math.min(currentPage * pagination.limit, pagination.totalProducts)}
                  </strong>{" "}
                  of <strong className="text-slate-900">{pagination.totalProducts}</strong> products
                </span>
              )}
            </div>

            {/* Clear All shortcut if filters applied */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Product Grid */}
          <ProductGrid
            products={products}
            loading={loading}
            error={error}
            onRetry={() => {
              // Trigger reload by updating state or refetching
              setLoading(true);
              const options = {
                page: currentPage,
                limit: 12,
              };
              if (selectedCategory !== "all") options.category = selectedCategory;
              if (searchQuery.trim()) options.search = searchQuery.trim();
              if (featuredOnly) options.featured = true;
              if (sortBy && sortBy !== "default") options.sort = sortBy;
              if (minPrice !== "") options.minPrice = minPrice;
              if (maxPrice !== "") options.maxPrice = maxPrice;
              fetchProductsWithPagination(options)
                .then((res) => {
                  setProducts(res.data || []);
                  setPagination({
                    totalProducts: res.totalProducts || 0,
                    totalPages: res.totalPages || 1,
                    hasNextPage: Boolean(res.hasNextPage),
                    hasPrevPage: Boolean(res.hasPrevPage),
                    limit: res.limit || 12,
                  });
                })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
            }}
            onClearFilters={handleClearAllFilters}
          />

          {/* Pagination Controls */}
          {!loading && !error && pagination.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalProducts={pagination.totalProducts}
              limit={pagination.limit}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}
