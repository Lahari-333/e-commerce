import API_BASE_URL from "../config/apiConfig";

async function handleResponse(response) {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Public: Fetch reviews and aggregates for a product
 */
export async function fetchProductReviewsApi(productId) {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);
  return handleResponse(res);
}

/**
 * Protected: Submit a new product review
 */
export async function submitProductReviewApi(token, productId, { rating, review_title, review_text }) {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rating, review_title, review_text })
  });
  return handleResponse(res);
}

/**
 * Protected: Edit review (owner only)
 */
export async function updateProductReviewApi(token, reviewId, { rating, review_title, review_text }) {
  const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rating, review_title, review_text })
  });
  return handleResponse(res);
}

/**
 * Protected: Delete review (owner or admin)
 */
export async function deleteProductReviewApi(token, reviewId) {
  const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}
