/**
 * Service d'envoi des notifications par e-mail avec Resend.
 */

async function sendOrderNotification(order) {
  const apiKey = process.env.RESEND_API_KEY;
  const notificationEmail =
    process.env.ORDER_NOTIFICATION_EMAIL || "mouhamedamzat14@gmail.com";

  if (!apiKey) {
    console.error("RESEND_API_KEY n'est pas configurée.");
    return;
  }

  const productName =
    order.product?.name ||
    order.product?.nom ||
    order.productName ||
    "Produit";

  const amount =
    order.product?.price ??
    order.amount ??
    order.price ??
    "Non indiqué";

  const orderNumber =
    order.orderNumber ||
    order.number ||
    order.id ||
    "Non indiqué";

  const html = `
    <h2>🛒 Nouvelle commande - Momo Shop</h2>

    <p><strong>Numéro de commande :</strong> ${orderNumber}</p>

    <hr>

    <p><strong>Produit :</strong> ${productName}</p>
    <p><strong>Montant :</strong> ${amount} FCFA</p>

    <h3>Informations du client</h3>

    <p><strong>Nom :</strong> ${order.customerName || "Non indiqué"}</p>
    <p><strong>Téléphone :</strong> ${order.customerPhone || "Non indiqué"}</p>
    <p><strong>E-mail :</strong> ${order.customerEmail || "Non indiqué"}</p>

    <h3>Informations Free Fire</h3>

    <p><strong>ID Free Fire :</strong> ${order.freeFireId || "Non indiqué"}</p>

    <hr>

    <p>Une nouvelle commande vient d'être créée sur Momo Shop.</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Momo Shop <onboarding@resend.dev>",
      to: [notificationEmail],
      subject: `🛒 Nouvelle commande ${orderNumber}`,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend a refusé l'e-mail : ${errorText}`);
  }

  return response.json();
}

module.exports = {
  sendOrderNotification,
};
