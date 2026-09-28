const { getProductById } = require("../data/products");
const orderModel = require("../models/orderModel");
const { validateOrderInput } = require("../middleware/validate");
const { sendOrderNotification } = require("../services/emailService");
/**
 * POST /api/orders
 * Crée une commande. Le prix n'est JAMAIS pris dans req.body : on relit
 * le produit par son id dans le catalogue serveur.
 */
function createOrder(req, res) {
  const errors = validateOrderInput(req.body);
  if (errors.length) {
    return res.status(400).json({ error: "Formulaire invalide", details: errors });
  }

  const product = getProductById(req.body.productId);
  if (!product) {
    return res.status(400).json({ error: "Produit inconnu." });
  }

  const order = orderModel.createOrder({
    product, // prix pris depuis `product.price` (serveur), jamais depuis le body
    freeFireId: String(req.body.freeFireId).trim(),
    customerName: String(req.body.customerName).trim(),
    customerPhone: String(req.body.customerPhone).trim(),
    customerEmail: String(req.body.customerEmail).trim().toLowerCase(),
  });
sendOrderNotification(order).catch((err) => {
  console.error("Erreur notification e-mail:", err);
});
  res.status(201).json({ order: toPublicOrder(order) });
}

/**
 * GET /api/orders/:orderNumber
 * Consultation publique du statut d'une commande. On ne renvoie que les
 * champs nécessaires au client (pas de données internes PayDunya brutes).
 * Pour limiter l'énumération, on exige aussi que l'email fourni en query
 * corresponde à celui de la commande.
 */
function getOrderStatus(req, res) {
  const order = orderModel.getOrderByNumber(req.params.orderNumber);

  if (!order) {
    return res.status(404).json({ error: "Commande introuvable." });
  }

  const email = (req.query.email || "").toLowerCase().trim();
  if (!email || email !== order.customer_email) {
    return res.status(404).json({ error: "Commande introuvable." });
  }

  res.json({ order: toPublicOrder(order) });
}

function toPublicOrder(order) {
  return {
    orderNumber: order.order_number,
    productName: order.product_name,
    price: order.price,
    freeFireId: order.free_fire_id,
    customerName: order.customer_name,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    createdAt: order.created_at,
    paymentUrl: order.payment_status === "PENDING" ? order.paydunya_invoice_url : null,
  };
}

module.exports = { createOrder, getOrderStatus, toPublicOrder };
