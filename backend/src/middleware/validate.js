const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// ID joueur Free Fire : numérique, généralement 8 à 12 chiffres.
const FREE_FIRE_ID_RE = /^[0-9]{6,12}$/;
// Numéro de téléphone bénin/international simple : chiffres, espaces, +
const PHONE_RE = /^[0-9+\s]{8,15}$/;

/**
 * Valide le corps d'une création de commande. Renvoie un tableau
 * d'erreurs (vide si tout est valide). Le contrôleur décide quoi en
 * faire — cette fonction ne connaît pas Express.
 */
function validateOrderInput(body) {
  const errors = [];

  if (!body.productId || typeof body.productId !== "string") {
    errors.push("Produit manquant ou invalide.");
  }
  if (!body.freeFireId || !FREE_FIRE_ID_RE.test(String(body.freeFireId).trim())) {
    errors.push("ID joueur Free Fire invalide (uniquement des chiffres).");
  }
  if (!body.customerName || String(body.customerName).trim().length < 2) {
    errors.push("Nom et prénom requis.");
  }
  if (!body.customerPhone || !PHONE_RE.test(String(body.customerPhone).trim())) {
    errors.push("Numéro de téléphone invalide.");
  }
  if (!body.customerEmail || !EMAIL_RE.test(String(body.customerEmail).trim())) {
    errors.push("Adresse e-mail invalide.");
  }

  return errors;
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? "Une erreur interne est survenue." : err.message,
  });
}

module.exports = { validateOrderInput, errorHandler };
