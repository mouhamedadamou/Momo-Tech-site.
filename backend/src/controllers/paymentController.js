const orderModel = require("../models/orderModel");
const paydunyaService = require("../services/paydunyaService");
const { toPublicOrder } = require("./orderController");

/**
 * POST /api/payments/initiate/:orderNumber
 * Crée (ou réutilise) une facture PayDunya pour une commande PENDING et
 * renvoie l'URL de paiement vers laquelle le frontend doit rediriger le
 * client.
 */
async function initiatePayment(req, res) {
  const order = orderModel.getOrderByNumber(req.params.orderNumber);

  if (!order) {
    return res.status(404).json({ error: "Commande introuvable." });
  }
  if (order.payment_status === "COMPLETED") {
    return res.status(409).json({ error: "Cette commande est déjà payée." });
  }

  // Réutilise la facture existante si le client relance le paiement sans
  // avoir annulé — évite de créer une facture PayDunya en double.
  if (order.paydunya_invoice_url && order.payment_status === "PENDING") {
    return res.json({ paymentUrl: order.paydunya_invoice_url });
  }

  try {
    const invoice = await paydunyaService.createInvoice(order);
    orderModel.attachPaydunyaInvoice(order.id, invoice);
    res.json({ paymentUrl: invoice.invoiceUrl });
  } catch (err) {
console.error("[PayDunya ERROR]", err);
    res.status(502).json({ error: "Impossible de contacter PayDunya pour le moment." });
  }
}

/**
 * POST /api/payments/ipn
 * Endpoint appelé par PayDunya (callback/IPN) après une tentative de
 * paiement. On NE FAIT JAMAIS confiance au contenu brut de cette requête
 * pour marquer une commande payée : on revérifie systématiquement le
 * statut directement auprès de PayDunya avant toute mise à jour.
 *
 * PAYDUNYA: le corps exact de l'IPN (souvent un champ `data` contenant
 * du JSON encodé) est à reconfirmer dans la doc officielle. Ce contrôleur
 * essaie plusieurs emplacements plausibles pour extraire le token.
 */
async function handleIpn(req, res) {
  const token = extractToken(req.body);

  if (!token) {
    return res.status(400).json({ error: "Token PayDunya manquant dans l'IPN." });
  }

  const order = orderModel.getOrderByPaydunyaToken(token);
  if (!order) {
    // On répond 200 quand même : PayDunya ne doit pas re-livrer
    // indéfiniment une notification qu'on ne peut de toute façon pas
    // rattacher à une commande connue.
    return res.status(200).json({ received: true, matched: false });
  }

  try {
    const { status } = await paydunyaService.confirmInvoice(token);
    orderModel.updatePaymentStatus(order.id, status, req.body.payment_method || null);
    res.status(200).json({ received: true, status });
  } catch (err) {
    // Important : on répond quand même 200 côté transport pour éviter que
    // PayDunya considère l'IPN comme perdu, mais on ne touche PAS au
    // statut de la commande si la revérification a échoué.
    res.status(200).json({ received: true, verified: false });
  }
}

/**
 * GET /api/payments/status/:orderNumber
 * Permet au frontend, sur la page de confirmation, de re-poller le vrai
 * statut d'une commande en forçant une revérification auprès de
 * PayDunya (utile si l'IPN met quelques secondes à arriver).
 */
async function refreshPaymentStatus(req, res) {
  const order = orderModel.getOrderByNumber(req.params.orderNumber);
  if (!order) {
    return res.status(404).json({ error: "Commande introuvable." });
  }
  if (!order.paydunya_token || order.payment_status !== "PENDING") {
    return res.json({ order: toPublicOrder(order) });
  }

  try {
    const { status } = await paydunyaService.confirmInvoice(order.paydunya_token);
    const updated = orderModel.updatePaymentStatus(order.id, status);
    res.json({ order: toPublicOrder(updated) });
  } catch (err) {
    // PayDunya injoignable : on renvoie l'état connu sans le modifier.
    res.json({ order: toPublicOrder(order) });
  }
}

function extractToken(body) {
  if (!body) return null;
  if (body.token) return body.token;
  if (body.data) {
    try {
      const parsed = typeof body.data === "string" ? JSON.parse(body.data) : body.data;
      return parsed.invoice?.token || parsed.token || null;
    } catch {
      return null;
    }
  }
  return null;
}

module.exports = { initiatePayment, handleIpn, refreshPaymentStatus };
