const orderModel = require("../models/orderModel");

function listOrders(req, res) {
  const { q, status, page, pageSize } = req.query;

  const result = orderModel.searchOrders({
    query: q || "",
    status: status || null,
    page: Number(page) || 1,
    pageSize: Number(pageSize) || 20,
  });

  res.json({
    orders: result.rows.map(toAdminOrder),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  });
}

function getStats(req, res) {
  res.json(orderModel.getDashboardStats());
}

/**
 * PATCH /api/admin/orders/:orderNumber/status
 * Change uniquement le statut de TRAITEMENT (workflow interne), jamais le
 * statut de paiement — celui-ci ne peut venir que de PayDunya (voir
 * paymentController). Un statut de paiement invalide ne peut donc pas
 * être atteint depuis cette route.
 */
function updateOrderStatus(req, res) {
  const order = orderModel.getOrderByNumber(req.params.orderNumber);
  if (!order) {
    return res.status(404).json({ error: "Commande introuvable." });
  }

  const { orderStatus } = req.body;
  if (!orderModel.ALLOWED_ORDER_STATUSES.includes(orderStatus)) {
    return res.status(400).json({
      error: `Statut invalide. Valeurs acceptées : ${orderModel.ALLOWED_ORDER_STATUSES.join(", ")}`,
    });
  }

  const updated = orderModel.updateOrderStatus(order.id, orderStatus);
  res.json({ order: toAdminOrder(updated) });
}

function toAdminOrder(order) {
  return {
    orderNumber: order.order_number,
    productName: order.product_name,
    price: order.price,
    freeFireId: order.free_fire_id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

module.exports = { listOrders, getStats, updateOrderStatus };
