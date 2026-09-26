const ICONS = {
  diamonds: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/></svg>`,
  subscriptions: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  other: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7L2 9.2l7.1-.6z"/></svg>`,
};

let CATALOG = { products: [], categories: {} };
let activeCategory = "all";

async function loadCatalog() {
  const grid = document.getElementById("product-grid");
  const tabs = document.getElementById("category-tabs");
  if (!grid) return;

  try {
    CATALOG = await api.getProducts();
    renderTabs(tabs);
    renderGrid(grid);
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--color-muted)">Impossible de charger les produits pour le moment. Réessaie dans un instant.</p>`;
  }
}

function renderTabs(tabs) {
  if (!tabs) return;
  const entries = [["all", "Tous"], ...Object.entries(CATALOG.categories)];
  tabs.innerHTML = entries
    .map(
      ([key, label]) =>
        `<button class="category-tab${key === activeCategory ? " active" : ""}" data-category="${key}">${label}</button>`
    )
    .join("");

  tabs.querySelectorAll(".category-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      renderTabs(tabs);
      renderGrid(document.getElementById("product-grid"));
    });
  });
}

function renderGrid(grid) {
  if (!grid) return;
  const items =
    activeCategory === "all"
      ? CATALOG.products
      : CATALOG.products.filter((p) => p.category === activeCategory);

  grid.innerHTML = items
    .map(
      (p) => `
    <article class="product-card reveal is-visible">
      <div class="product-icon">${ICONS[p.category] || ICONS.other}</div>
      <div class="product-name">${p.name}</div>
      ${p.quantity ? `<div class="product-qty">${p.quantity} ${p.unit}</div>` : ""}
      <div class="product-price">${formatFcfa(p.price)}</div>
      <button class="btn btn-primary btn-block" data-buy="${p.id}">Acheter</button>
    </article>
  `
    )
    .join("");

  grid.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = CATALOG.products.find((p) => p.id === btn.dataset.buy);
      if (product) openOrderModal(product);
    });
  });
}

/** Appelée depuis les liens de navigation (ex: "Diamants") pour filtrer
 * directement la bonne catégorie et amener l'utilisateur sur la section. */
function selectCategory(category) {
  activeCategory = category;
  const tabs = document.getElementById("category-tabs");
  const grid = document.getElementById("product-grid");
  if (CATALOG.products.length) {
    renderTabs(tabs);
    renderGrid(grid);
  }
}

document.addEventListener("DOMContentLoaded", loadCatalog);
