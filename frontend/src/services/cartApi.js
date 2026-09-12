const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Helper to process JSON API responses and standardize errors
 */
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
 * Fetch authenticated user's cart
 * @param {string} token - JWT bearer token
 */
export async function fetchCartApi(token) {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return handleResponse(response);
}

/**
 * Add an item to the user's cart
 * @param {string} token - JWT bearer token
 * @param {Object} itemData - { product_id, variant_id, quantity }
 */
export async function addItemToCartApi(token, { product_id, variant_id = null, quantity = 1 }) {
  const response = await fetch(`${API_BASE_URL}/cart/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ product_id, variant_id, quantity })
  });
  return handleResponse(response);
}

/**
 * Update the quantity of an existing cart item
 * @param {string} token - JWT bearer token
 * @param {number|string} itemId - cart_item ID
 * @param {number} quantity - new quantity
 */
export async function updateCartItemQuantityApi(token, itemId, quantity) {
  const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ quantity })
  });
  return handleResponse(response);
}

/**
 * Remove an item from the cart
 * @param {string} token - JWT bearer token
 * @param {number|string} itemId - cart_item ID
 */
export async function removeCartItemApi(token, itemId) {
  const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return handleResponse(response);
}

/**
 * Clear all items from the user's cart
 * @param {string} token - JWT bearer token
 */
export async function clearCartApi(token) {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return handleResponse(response);
}
