/**
 * Catalogue officiel des produits Momo Tech.
 *
 * C'EST LA SEULE SOURCE DE VÉRITÉ POUR LES PRIX.
 * Le frontend affiche ces produits pour information, mais quand une
 * commande est créée, le contrôleur relit toujours le prix ICI à partir
 * de `id` — jamais depuis ce que le client a envoyé dans la requête.
 *
 * Ne modifie pas ces tarifs sans instruction explicite du propriétaire
 * de la boutique.
 */

const PRODUCTS = [
  // --- Diamants ---
  { id: "diamond_110", category: "diamonds", name: "110 Diamants", quantity: 110, unit: "diamants", price: 800 },
  { id: "diamond_231", category: "diamonds", name: "231 Diamants", quantity: 231, unit: "diamants", price: 1600 },
  { id: "diamond_583", category: "diamonds", name: "583 Diamants", quantity: 583, unit: "diamants", price: 3500 },
  { id: "diamond_1188", category: "diamonds", name: "1188 Diamants", quantity: 1188, unit: "diamants", price: 7250 },
  { id: "diamond_2420", category: "diamonds", name: "2420 Diamants", quantity: 2420, unit: "diamants", price: 13000 },
  { id: "diamond_6160", category: "diamonds", name: "6160 Diamants", quantity: 6160, unit: "diamants", price: 35500 },

  // --- Abonnements ---
  { id: "sub_hebdo", category: "subscriptions", name: "Abonnement Hebdo", quantity: null, unit: null, price: 1600 },
  { id: "sub_mois", category: "subscriptions", name: "Abonnement Mois", quantity: null, unit: null, price: 7300 },
  { id: "sub_lite", category: "subscriptions", name: "Abonnement Lite", quantity: null, unit: null, price: 600 },

  // --- Autres produits ---
  { id: "booyah_pass", category: "other", name: "Booyah Pass", quantity: null, unit: null, price: 3200 },
  { id: "level_up", category: "other", name: "Monter de niveau", quantity: null, unit: null, price: 2800 },
];

const CATEGORIES = {
  diamonds: "Diamants",
  subscriptions: "Abonnements",
  other: "Autres produits",
};

function getAllProducts() {
  return PRODUCTS;
}

function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

function getCategories() {
  return CATEGORIES;
}

module.exports = { getAllProducts, getProductById, getCategories, PRODUCTS, CATEGORIES };
