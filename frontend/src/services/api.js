const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Helper to handle fetch responses and errors consistently
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Ignore JSON parse errors for non-JSON responses
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Fetch all active products with optional query parameters:
 * @param {Object} options - { search, category, featured, sort, minPrice, maxPrice, page, limit, withPagination }
 */
export async function fetchProducts(options = {}) {
  const params = new URLSearchParams();

  if (options.search && options.search.trim()) {
    params.append("search", options.search.trim());
  }
  if (options.category) {
    params.append("category", options.category);
  }
  if (options.featured) {
    params.append("featured", "true");
  }
  if (options.sort) {
    params.append("sort", options.sort);
  }
  if (options.minPrice !== undefined && options.minPrice !== "" && options.minPrice !== null) {
    params.append("minPrice", options.minPrice);
  }
  if (options.maxPrice !== undefined && options.maxPrice !== "" && options.maxPrice !== null) {
    params.append("maxPrice", options.maxPrice);
  }
  if (options.page !== undefined) {
    params.append("page", options.page);
  }
  if (options.limit !== undefined) {
    params.append("limit", options.limit);
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ""}`;

  const result = await handleResponse(await fetch(url));

  // If caller specifically requested the structured pagination response:
  if (options.withPagination) {
    return result;
  }

  // Backwards compatibility: return array with metadata attached
  const list = result.data || [];
  list.pagination = {
    totalProducts: result.totalProducts || list.length,
    currentPage: result.currentPage || 1,
    totalPages: result.totalPages || 1,
    hasNextPage: Boolean(result.hasNextPage),
    hasPrevPage: Boolean(result.hasPrevPage),
    limit: result.limit || list.length,
  };
  return list;
}

/**
 * Fetch products with explicit pagination response
 */
export async function fetchProductsWithPagination(options = {}) {
  return fetchProducts({ ...options, withPagination: true });
}

/**
 * Fetch featured products
 */
export async function fetchFeaturedProducts() {
  const url = `${API_BASE_URL}/products/featured`;
  const result = await handleResponse(await fetch(url));
  return result.data || [];
}

/**
 * Fetch single product details by slug or id
 * @param {string|number} slug
 */
export async function fetchProductBySlug(slug) {
  const url = `${API_BASE_URL}/products/${encodeURIComponent(slug)}`;
  const result = await handleResponse(await fetch(url));
  return result.data;
}

/**
 * Fetch all active categories
 */
export async function fetchCategories() {
  const url = `${API_BASE_URL}/categories`;
  const result = await handleResponse(await fetch(url));
  return result.data || [];
}
