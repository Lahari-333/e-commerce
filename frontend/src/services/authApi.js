import API_BASE_URL from "../config/apiConfig";

/**
 * Handle API responses and standardize error messages
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
 * Register a new customer
 * @param {string} name
 * @param {string} email
 * @param {string} password
 */
export async function registerApi(name, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });
  return handleResponse(response);
}

/**
 * Log in an existing user
 * @param {string} email
 * @param {string} password
 */
export async function loginApi(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(response);
}

/**
 * Fetch the currently authenticated user's profile using their JWT
 * @param {string} token
 */
export async function getMeApi(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return handleResponse(response);
}
