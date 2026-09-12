import { useState, useEffect, useCallback } from "react";
import { fetchProductsWithPagination } from "../services/api";

export function useProducts(options = {}) {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    totalProducts: 0,
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 12,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const search = options.search || "";
  const category = options.category || "";
  const featured = options.featured || false;
  const sort = options.sort || "default";
  const minPrice = options.minPrice !== undefined ? options.minPrice : "";
  const maxPrice = options.maxPrice !== undefined ? options.maxPrice : "";
  const page = options.page || 1;
  const limit = options.limit || 12;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProductsWithPagination({
        search: search || undefined,
        category: category !== "all" ? category : undefined,
        featured: featured || undefined,
        sort: sort || undefined,
        minPrice: minPrice !== "" ? minPrice : undefined,
        maxPrice: maxPrice !== "" ? maxPrice : undefined,
        page,
        limit,
      });

      setProducts(res.data || []);
      setPagination({
        totalProducts: res.totalProducts || 0,
        currentPage: res.currentPage || 1,
        totalPages: res.totalPages || 1,
        hasNextPage: Boolean(res.hasNextPage),
        hasPrevPage: Boolean(res.hasPrevPage),
        limit: res.limit || limit,
      });
    } catch (err) {
      console.error("useProducts hook error:", err);
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, category, featured, sort, minPrice, maxPrice, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { products, pagination, loading, error, refetch: load };
}
