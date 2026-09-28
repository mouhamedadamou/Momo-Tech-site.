const TOKEN_KEY = "momoTechAdminToken";

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

const loginView = document.getElementById("admin-login-view");
const dashboardView = document.getElementById("admin-dashboard-view");

function showLoggedInUI() {
  loginView.style.display = "none";
  dashboardView.style.display = "block";
  loadStats();
  loadOrders();
}

function showLoggedOutUI() {
  loginView.style.display = "block";
  dashboardView.style.display = "none";
}

// ---------- Login ----------
document.getElementById("admin-login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorEl = document.getElementById("admin-login-error");
  errorEl.textContent = "";

  try {
    const { token } = await api.adminLogin(form.email.value.trim(), form.password.value);
    setToken(token);
    showLoggedInUI();
  } catch (err) {
    errorEl.textContent = err.message || "Connexion impossible.";
  }
});

document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
  clearToken();
  showLoggedOutUI();
});

// ---------- Stats ----------
async function loadStats() {
  try {
    const stats = await api.adminStats(getToken());
    document.getElementById("stat-total").textContent = stats.totalOrders;
    document.getElementById("stat-paid").textContent = stats.paidOrders;
    document.getElementById("stat-pending").textContent = stats.pendingOrders;
    document.getElementById("stat-revenue").textContent = formatFcfa(stats.revenue);
    document.getElementById("stat-today").textContent = stats.todayOrders;
  } catch (err) {
    if (err.status === 401) return handleUnauthorized();
    showToast("Impossible de charger les statistiques.", "error");
  }
}

// ---------- Orders list ----------
const PAYMENT_STATUS_LABELS = {
  PENDING: "En attente",
  COMPLETED: "Payé",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
};
const ORDER_STATUSES = ["En attente", "En traitement", "Terminée", "Annulée"];
async function loadOrders(page = 1) {
  const query = document.getElementById("admin-search").value.trim();
  const status = document.getElementById("admin-status-filter").value;
  const tbody = document.getElementById("orders-table-body");

  tbody.innerHTML = `<tr><td colspan="8">Chargement...</td></tr>`;

  try {
    const result = await api.adminListOrders(getToken(), { q: query, status, page });
    if (!result.orders.length) {
      tbody.innerHTML = `<tr><td colspan="8">Aucune commande trouvée.</td></tr>`;
      return;
    }
    tbody.innerHTML = result.orders.map(renderOrderRow).join("");
    attachStatusHandlers();
    attachDeleteHandlers();
  } catch (err) {
    if (err.status === 401) return handleUnauthorized();
    tbody.innerHTML = `<tr><td colspan="8">Erreur de chargement.</td></tr>`;
  }
}

function renderOrderRow(order) {
  const statusOptions = ORDER_STATUSES
    .map((s) => `<option value="${s}"${s === order.orderStatus ? " selected" : ""}>${s}</option>`)
    .join("");

  return `
    <tr>
      <td>${order.orderNumber}</td>
      <td>${new Date(order.createdAt).toLocaleString("fr-FR")}</td>
      <td>${order.customerName}<br><small>${order.customerPhone}</small></td>
      <td>${order.freeFireId}</td>
      <td>${order.productName}</td>
      <td>${formatFcfa(order.price)}</td>
      <td><span class="status-badge ${order.paymentStatus.toLowerCase()}">${PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}</span></td>
      <td>
        <select data-order-number="${order.orderNumber}" class="status-select">
          ${statusOptions}
        </select>
      </td>
      <td>
    <button type="button" class="delete-order-btn" data-order-number="${order.orderNumber}">
        Supprimer
    </button>
</td>
    </tr>
  `;
}

function attachStatusHandlers() {
  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async () => {
      try {
        await api.adminUpdateOrderStatus(getToken(), select.dataset.orderNumber, select.value);
        showToast("Statut mis à jour.", "success");
      } catch (err) {
        showToast(err.message || "Échec de la mise à jour.", "error");
      }
    });
  });
}

function attachDeleteHandlers() {
  document.querySelectorAll(".delete-order-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const orderNumber = button.dataset.orderNumber;

      if (!confirm(`Supprimer la commande ${orderNumber} ?`)) {
        return;
      }

      try {
        await api.adminDeleteOrder(getToken(), orderNumber);
        showToast("Commande supprimée.", "success");
        loadOrders(1);
      } catch (err) {
        showToast(err.message || "Échec de la suppression.", "error");
      }
    });
  });
}
function handleUnauthorized() {
  clearToken();
  showLoggedOutUI();
  showToast("Session expirée, reconnecte-toi.", "error");
}

document.getElementById("admin-search-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  loadOrders(1);
});
document.getElementById("admin-status-filter")?.addEventListener("change", () => loadOrders(1));

document.addEventListener("DOMContentLoaded", () => {
  if (getToken()) {
    showLoggedInUI();
  } else {
    showLoggedOutUI();
  }
});
