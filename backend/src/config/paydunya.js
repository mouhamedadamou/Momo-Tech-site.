/**
 * Config PayDunya — lue UNIQUEMENT depuis les variables d'environnement.
 * Ne jamais coder une clé en dur ici, ni la renvoyer au frontend.
 */

function required(name) {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV !== "test") {
    // On log un avertissement plutôt que de planter au démarrage, pour
    // que le reste du site (catalogue, admin) reste utilisable pendant
    // la configuration initiale — mais /api/payments échouera tant que
    // ce n'est pas renseigné.
    // eslint-disable-next-line no-console
    console.warn(`[PayDunya] Variable d'environnement manquante: ${name}`);
  }
  return value || "";
}

const paydunyaConfig = {
  mode: process.env.PAYDUNYA_MODE === "live" ? "live" : "test",
  masterKey: required("PAYDUNYA_MASTER_KEY"),
  privateKey: required("PAYDUNYA_PRIVATE_KEY"),
  token: required("PAYDUNYA_TOKEN"),
  publicKey: process.env.PAYDUNYA_PUBLIC_KEY || "",
  callbackUrl: required("PAYDUNYA_CALLBACK_URL"),
  returnUrl: required("PAYDUNYA_RETURN_URL"),
  cancelUrl: required("PAYDUNYA_CANCEL_URL"),
  storeName: process.env.STORE_NAME || "Momo Tech",
  // Base URL de l'API PayDunya (identique en test/live, le mode se
  // détermine par les clés de test/prod fournies par PayDunya, pas par
  // l'URL — PAYDUNYA: reconfirme ce point dans la doc officielle).
  apiBaseUrl:
  process.env.PAYDUNYA_MODE === "live"
    ? "https://app.paydunya.com/api/v1"
    : "https://app.paydunya.com/sandbox-api/v1",
};

module.exports = paydunyaConfig;
