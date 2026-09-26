const paydunyaConfig = require("../config/paydunya");

/**
 * Service d'intégration PayDunya.
 *
 * Deux opérations :
 *  - createInvoice(order)  → crée une facture PayDunya et renvoie l'URL
 *    de paiement vers laquelle rediriger le client.
 *  - confirmInvoice(token) → interroge PayDunya pour connaître le VRAI
 *    statut d'une facture. C'est cette fonction, jamais le contenu brut
 *    de l'IPN ni le retour du client, qui décide si une commande est
 *    payée.
 *
 * PAYDUNYA: Les endpoints et noms de champs ci-dessous suivent le
 * fonctionnement standard de l'API "checkout-invoice" de PayDunya au
 * moment de l'écriture de ce fichier (headers PAYDUNYA-MASTER-KEY /
 * PAYDUNYA-PRIVATE-KEY / PAYDUNYA-TOKEN, endpoint /checkout-invoice/create
 * puis /checkout-invoice/confirm/{token}). Comme ce build n'a pas d'accès
 * réseau pour appeler PayDunya en direct, RECONTRÔLE ces détails dans la
 * documentation officielle avant la mise en production.
 */

function headers() {
  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": paydunyaConfig.masterKey,
    "PAYDUNYA-PRIVATE-KEY": paydunyaConfig.privateKey,
    "PAYDUNYA-TOKEN": paydunyaConfig.token,
  };
}

/**
 * Crée une facture PayDunya pour une commande déjà enregistrée en base
 * (avec un prix déjà validé côté serveur — voir orderController).
 *
 * @param {object} order - ligne `orders` telle que stockée en DB
 * @returns {Promise<{ token: string, invoiceUrl: string }>}
 */
async function createInvoice(order) {
  const payload = {
    invoice: {
      total_amount: order.price, // PAYDUNYA: montant en FCFA, entier
      description: `Momo Tech - ${order.product_name}`,
    },
    store: {
      name: paydunyaConfig.storeName,
    },
    actions: {
      cancel_url: paydunyaConfig.cancelUrl,
      // On ajoute le numéro de commande en query param pour que la page
      // de confirmation sache quelle commande afficher au retour — ce
      // paramètre sert uniquement à savoir QUOI afficher, jamais à
      // décider si la commande est payée (voir refreshPaymentStatus qui
      // revérifie toujours auprès de PayDunya).
      return_url: `${paydunyaConfig.returnUrl}?order=${encodeURIComponent(order.order_number)}`,
      callback_url: paydunyaConfig.callbackUrl,
    },
    custom_data: {
      // Sert à retrouver la commande depuis l'IPN si besoin, en plus du
      // token PayDunya qu'on stocke de toute façon sur la commande.
      order_number: order.order_number,
      free_fire_id: order.free_fire_id,
    },
  };

  const response = await fetch(`${paydunyaConfig.apiBaseUrl}/checkout-invoice/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  // PAYDUNYA: un succès renvoie response_code "00" et un `token` +
  // `response_text` contenant l'URL de paiement. Reconfirme ce contrat
  // exact dans la doc au moment de brancher les vraies clés.
  if (data.response_code !== "00" || !data.token) {
    const message = data.response_text || "Échec de création de la facture PayDunya";
    const error = new Error(message);
    error.paydunyaResponse = data;
    throw error;
  }

  return {
    token: data.token,
    invoiceUrl: data.response_text,
  };
}

/**
 * Statuts PayDunya normalisés vers nos statuts internes.
 */
function mapPaydunyaStatus(paydunyaStatus) {
  switch ((paydunyaStatus || "").toLowerCase()) {
    case "completed":
      return "COMPLETED";
    case "cancelled":
    case "canceled":
      return "CANCELLED";
    case "failed":
      return "FAILED";
    default:
      return "PENDING";
  }
}

/**
 * Revérifie le statut réel d'une facture directement auprès de PayDunya.
 * C'est la SEULE source de vérité pour marquer une commande payée —
 * jamais le contenu brut d'une requête IPN non revérifiée, jamais le
 * simple fait que le client soit revenu sur la page de succès.
 *
 * @param {string} token - token PayDunya de la facture
 * @returns {Promise<{ status: "PENDING"|"COMPLETED"|"FAILED"|"CANCELLED", raw: object }>}
 */
async function confirmInvoice(token) {
  const response = await fetch(`${paydunyaConfig.apiBaseUrl}/checkout-invoice/confirm/${token}`, {
    method: "GET",
    headers: headers(),
  });

  const data = await response.json();

  // PAYDUNYA: la confirmation renvoie normalement `status` ("completed",
  // "pending", "cancelled"...) sous `data.status` ou à la racine selon
  // la version d'API — reconfirme la forme exacte de la réponse.
  const rawStatus = data.status || (data.invoice && data.invoice.status);

  return {
    status: mapPaydunyaStatus(rawStatus),
    raw: data,
  };
}

module.exports = { createInvoice, confirmInvoice };
