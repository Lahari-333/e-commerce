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

// 1. Dashboard Analytics
export async function fetchDashboardStatsApi(token) {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

// 2. Product Management
export async function fetchAdminProductsApi(token, params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);
  if (params.status) query.append("status", params.status);

  const url = `${API_BASE_URL}/admin/products${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function fetchAdminProductByIdApi(token, id) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function createAdminProductApi(token, productData) {
  const res = await fetch(`${API_BASE_URL}/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  return handleResponse(res);
}

export async function updateAdminProductApi(token, id, productData) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  return handleResponse(res);
}

export async function deleteAdminProductApi(token, id) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

// 3. Inventory Management
export async function fetchAdminInventoryApi(token) {
  const res = await fetch(`${API_BASE_URL}/admin/inventory`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function updateAdminInventoryApi(token, id, inventoryData) {
  const res = await fetch(`${API_BASE_URL}/admin/inventory/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(inventoryData)
  });
  return handleResponse(res);
}

// 4. Order Management
export async function fetchAdminOrdersApi(token, params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.search) query.append("search", params.search);

  const url = `${API_BASE_URL}/admin/orders${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function fetchAdminOrderByIdApi(token, id) {
  const res = await fetch(`${API_BASE_URL}/admin/orders/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function updateAdminOrderStatusApi(token, id, { status, comment }) {
  const res = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status, comment })
  });
  return handleResponse(res);
}

// 5. User Management
export async function fetchAdminUsersApi(token, params = {}) {
  const query = new URLSearchParams();
  if (params.role) query.append("role", params.role);
  if (params.search) query.append("search", params.search);

  const url = `${API_BASE_URL}/admin/users${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function fetchAdminUserByIdApi(token, id) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

// 6. Review Moderation Management
export async function fetchAdminReviewsApi(token, params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.rating) query.append("rating", params.rating);
  if (params.search) query.append("search", params.search);

  const url = `${API_BASE_URL}/admin/reviews${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function updateAdminReviewStatusApi(token, id, is_active) {
  const res = await fetch(`${API_BASE_URL}/admin/reviews/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ is_active })
  });
  return handleResponse(res);
}
