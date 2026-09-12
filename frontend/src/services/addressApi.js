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
 * Fetch all addresses for the authenticated user
 * @param {string} token
 */
export async function fetchAddressesApi(token) {
  const response = await fetch(`${API_BASE_URL}/addresses`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return handleResponse(response);
}

/**
 * Create a new address
 * @param {string} token
 * @param {Object} addressData
 */
export async function createAddressApi(token, addressData) {
  const response = await fetch(`${API_BASE_URL}/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(addressData)
  });
  return handleResponse(response);
}

/**
 * Update an existing address
 * @param {string} token
 * @param {number|string} addressId
 * @param {Object} addressData
 */
export async function updateAddressApi(token, addressId, addressData) {
  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(addressData)
  });
  return handleResponse(response);
}

/**
 * Delete an address
 * @param {string} token
 * @param {number|string} addressId
 */
export async function deleteAddressApi(token, addressId) {
  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return handleResponse(response);
}
