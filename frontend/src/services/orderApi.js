const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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
 * Place a new order
 * @param {string} token
 * @param {Object} orderData - { address_id, payment_method, notes }
 */
export async function createOrderApi(token, orderData) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  return handleResponse(response);
}

/**
 * Fetch all orders for the authenticated customer
 * @param {string} token
 */
export async function fetchOrdersApi(token) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return handleResponse(response);
}

/**
 * Fetch a single order by ID or order_number
 * @param {string} token
 * @param {string|number} orderId
 */
export async function fetchOrderByIdApi(token, orderId) {
  const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return handleResponse(response);
}
