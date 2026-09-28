/**
 * Adapte cette URL vers ton backend (voir README section 2).
 * En développement local : http://localhost:4000
 */
const API_BASE_URL = "https://momo-tech.onrender.com";

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const err = new Error("Impossible de contacter le serveur. Vérifie ta connexion.");
    err.isNetworkError = true;
    throw err;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // réponse vide, on laisse data = null
  }

  if (!response.ok) {
    const message = (data && (data.error || (data.details && data.details.join(" ")))) || "Une erreur est survenue.";
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

const api = {
  getProducts: () => apiRequest("/api/products"),
  createOrder: (payload) => apiRequest("/api/orders", { method: "POST", body: payload }),
  getOrderStatus: (orderNumber, email) =>
    apiRequest(`/api/orders/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`),
  initiatePayment: (orderNumber) =>
    apiRequest(`/api/payments/initiate/${encodeURIComponent(orderNumber)}`, { method: "POST" }),
  refreshPaymentStatus: (orderNumber) => apiRequest(`/api/payments/status/${encodeURIComponent(orderNumber)}`),

  adminLogin: (email, password) => apiRequest("/api/auth/login", { method: "POST", body: { email, password } }),
  adminListOrders: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/orders${qs ? `?${qs}` : ""}`, { token });
  },
  adminStats: (token) => apiRequest("/api/admin/stats", { token }),
  adminUpdateOrderStatus: (token, orderNumber, orderStatus) =>
    apiRequest(`/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: "PATCH",
      token,
      body: { orderStatus },
    }),

adminDeleteOrder: (token, orderNumber) =>
  apiRequest(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, {
    method: "DELETE",
    token,
   }),
  };
