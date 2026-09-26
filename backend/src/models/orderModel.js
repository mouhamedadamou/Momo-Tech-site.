const db = require("../config/db");
const { generateOrderNumber } = require("../utils/orderNumber");

function createOrder({ product, freeFireId, customerName, customerPhone, customerEmail }) {
  const orderNumber = generateOrderNumber();

  const stmt = db.prepare(`
    INSERT INTO orders (
      order_number, product_id, product_name, price,
      free_fire_id, customer_name, customer_phone, customer_email,
      payment_status, order_status
    ) VALUES (
      @orderNumber, @productId, @productName, @price,
      @freeFireId, @customerName, @customerPhone, @customerEmail,
      'PENDING', 'En attente'
    )
  `);

  const result = stmt.run({
    orderNumber,
    productId: product.id,
    productName: product.name,
    price: product.price,
    freeFireId,
    customerName,
    customerPhone,
    customerEmail,
  });

  return getOrderById(result.lastInsertRowid);
}

function getOrderById(id) {
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
}

function getOrderByNumber(orderNumber) {
  return db.prepare("SELECT * FROM orders WHERE order_number = ?").get(orderNumber);
}

function getOrderByPaydunyaToken(token) {
  return db.prepare("SELECT * FROM orders WHERE paydunya_token = ?").get(token);
}

function attachPaydunyaInvoice(orderId, { token, invoiceUrl }) {
  db.prepare(`
    UPDATE orders
    SET paydunya_token = ?, paydunya_invoice_url = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(token, invoiceUrl, orderId);
  return getOrderById(orderId);
}

/**
 * Statuts de paiement possibles : PENDING | COMPLETED | FAILED | CANCELLED
 * Ne fait aucune supposition sur la source de la mise à jour — le contrôleur
 * appelant est responsable de n'appeler ceci qu'après revérification
 * réelle auprès de PayDunya.
 */
function updatePaymentStatus(orderId, paymentStatus, paymentMethod) {
  const orderStatusMap = {
    COMPLETED: "Payée",
    FAILED: "Échec",
    CANCELLED: "Annulée",
    PENDING: "En attente",
  };

  db.prepare(`
    UPDATE orders
    SET payment_status = ?,
        order_status = ?,
        payment_method = COALESCE(?, payment_method),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(paymentStatus, orderStatusMap[paymentStatus] || "En attente", paymentMethod || null, orderId);

  return getOrderById(orderId);
}

/**
 * Changement du statut de TRAITEMENT (workflow interne admin), distinct
 * du statut de paiement. Volontairement une fonction séparée pour qu'il
 * soit impossible d'appeler ce chemin de code pour falsifier un paiement.
 */
const ALLOWED_ORDER_STATUSES = ["En attente", "Payée", "En traitement", "Terminée", "Annulée", "Échec"];

function updateOrderStatus(orderId, orderStatus) {
  if (!ALLOWED_ORDER_STATUSES.includes(orderStatus)) {
    throw new Error("Statut de commande invalide");
  }
  db.prepare(`
    UPDATE orders SET order_status = ?, updated_at = datetime('now') WHERE id = ?
  `).run(orderStatus, orderId);
  return getOrderById(orderId);
}

function searchOrders({ query, status, page = 1, pageSize = 20 }) {
  const conditions = [];
  const params = {};

  if (query) {
    conditions.push(`(
      order_number LIKE @q OR
      free_fire_id LIKE @q OR
      customer_phone LIKE @q OR
      customer_email LIKE @q
    )`);
    params.q = `%${query}%`;
  }

  if (status) {
    conditions.push(`payment_status = @status`);
    params.status = status;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (Math.max(1, page) - 1) * pageSize;

  const rows = db.prepare(`
    SELECT * FROM orders
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT @pageSize OFFSET @offset
  `).all({ ...params, pageSize, offset });

  const { total } = db.prepare(`
    SELECT COUNT(*) as total FROM orders ${whereClause}
  `).get(params);

  return { rows, total, page, pageSize };
}

function getDashboardStats() {
  const totals = db.prepare(`
    SELECT
      COUNT(*) AS totalOrders,
      SUM(CASE WHEN payment_status = 'COMPLETED' THEN 1 ELSE 0 END) AS paidOrders,
      SUM(CASE WHEN payment_status = 'PENDING' THEN 1 ELSE 0 END) AS pendingOrders,
      SUM(CASE WHEN payment_status = 'COMPLETED' THEN price ELSE 0 END) AS revenue
    FROM orders
  `).get();

  const today = db.prepare(`
    SELECT COUNT(*) AS todayOrders
    FROM orders
    WHERE date(created_at) = date('now')
  `).get();

  return {
    totalOrders: totals.totalOrders || 0,
    paidOrders: totals.paidOrders || 0,
    pendingOrders: totals.pendingOrders || 0,
    revenue: totals.revenue || 0,
    todayOrders: today.todayOrders || 0,
  };
}

module.exports = {
  createOrder,
  getOrderById,
  getOrderByNumber,
  getOrderByPaydunyaToken,
  attachPaydunyaInvoice,
  updatePaymentStatus,
  updateOrderStatus,
  searchOrders,
  getDashboardStats,
  ALLOWED_ORDER_STATUSES,
};
