import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import CategoryFilter from "../components/CategoryFilter";
import ProductGrid from "../components/ProductGrid";
import { fetchCategories, fetchFeaturedProducts, fetchProducts } from "../services/api";
import { Sparkles, ArrowRight, Layers, SlidersHorizontal, Search } from "lucide-react";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorFeatured, setErrorFeatured] = useState(null);
  const [errorAll, setErrorAll] = useState(null);

  // Load initial catalog data
  useEffect(() => {
    async function loadData() {
      // 1. Categories
      try {
        const catData = await fetchCategories();
        setCategories(catData);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }

      // 2. Featured products
      try {
        setLoadingFeatured(true);
        const featuredData = await fetchFeaturedProducts();
        setFeaturedProducts(featuredData);
        setErrorFeatured(null);
      } catch (err) {
        console.error("Failed to load featured products:", err);
        setErrorFeatured(err.message || "Failed to load featured products");
      } finally {
        setLoadingFeatured(false);
      }
    }

    loadData();
  }, []);

  // Load / Filter products when category or search changes
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingAll(true);
        const params = {};
        if (selectedCategory !== "all") {
          params.category = selectedCategory;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        const prodData = await fetchProducts(params);
        setAllProducts(prodData);
        setErrorAll(null);
      } catch (err) {
        console.error("Failed to load storefront products:", err);
        setErrorAll(err.message || "Failed to load storefront products");
      } finally {
        setLoadingAll(false);
      }
    }

    loadProducts();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Categories Section */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              <Layers className="w-3.5 h-3.5" />
              Category Navigator
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Explore by Category
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Pills Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => {
            setSelectedCategory(slug);
            const el = document.getElementById("all-products");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          variant="pills"
        />
      </section>

      {/* 3. Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Editor's Selection
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Featured Highlights
            </h2>
          </div>
          <Link
            to="/products?featured=true"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            See All Featured <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ProductGrid
          products={featuredProducts}
          loading={loadingFeatured}
          error={errorFeatured}
          onRetry={() => {
            setLoadingFeatured(true);
            fetchFeaturedProducts()
              .then(setFeaturedProducts)
              .catch((err) => setErrorFeatured(err.message))
              .finally(() => setLoadingFeatured(false));
          }}
        />
      </section>

      {/* 4. Complete Storefront Explorer */}
      <section id="all-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Live Storefront
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              All Available Products
            </h2>
          </div>

          {/* Quick Filters & Live Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search products in view..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none placeholder:text-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <Link
              to="/products"
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors whitespace-nowrap w-full sm:w-auto text-center"
            >
              Open Full Catalog
            </Link>
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={allProducts}
          loading={loadingAll}
          error={errorAll}
          onRetry={() => {
            setLoadingAll(true);
            fetchProducts({
              category: selectedCategory !== "all" ? selectedCategory : undefined,
              search: searchQuery || undefined,
            })
              .then(setAllProducts)
              .catch((err) => setErrorAll(err.message))
              .finally(() => setLoadingAll(false));
          }}
          onClearFilters={() => {
            setSelectedCategory("all");
            setSearchQuery("");
          }}
        />
      </section>
    </div>
  );
}
