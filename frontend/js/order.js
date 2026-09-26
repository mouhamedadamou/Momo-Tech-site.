let currentProduct = null;
let currentStep = 1;

const overlay = () => document.getElementById("order-modal-overlay");
const stepInfo = () => document.getElementById("step-info");
const stepRecap = () => document.getElementById("step-recap");
const progressDots = () => document.querySelectorAll("#order-progress span");

function openOrderModal(product) {
  currentProduct = product;
  currentStep = 1;

  document.getElementById("selected-product-name").textContent = product.name;
  document.getElementById("selected-product-price").textContent = formatFcfa(product.price);

  document.getElementById("order-form").reset();
  clearFieldErrors();
  showStep(1);

  overlay().classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeOrderModal() {
  overlay().classList.remove("is-open");
  document.body.style.overflow = "";
}

function showStep(step) {
  currentStep = step;
  stepInfo().style.display = step === 1 ? "block" : "none";
  stepRecap().style.display = step === 2 ? "block" : "none";
  progressDots().forEach((dot, i) => dot.classList.toggle("active", i < step));
}

function clearFieldErrors() {
  document.querySelectorAll("#order-form .field").forEach((f) => f.classList.remove("has-error"));
}

function readFormValues() {
  const form = document.getElementById("order-form");
  return {
    productId: currentProduct.id,
    freeFireId: form.freeFireId.value.trim(),
    customerName: form.customerName.value.trim(),
    customerPhone: form.customerPhone.value.trim(),
    customerEmail: form.customerEmail.value.trim(),
  };
}

/** Validation légère côté front — la validation qui compte reste côté serveur. */
function validateClientSide(values) {
  const errors = {};
  if (!/^[0-9]{6,12}$/.test(values.freeFireId)) {
    errors.freeFireId = "L'ID Free Fire doit contenir uniquement des chiffres (6 à 12).";
  }
  if (values.customerName.length < 2) {
    errors.customerName = "Nom et prénom requis.";
  }
  if (!/^[0-9+\s]{8,15}$/.test(values.customerPhone)) {
    errors.customerPhone = "Numéro de téléphone invalide.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.customerEmail)) {
    errors.customerEmail = "Adresse e-mail invalide.";
  }
  return errors;
}

function applyFieldErrors(errors) {
  clearFieldErrors();
  Object.keys(errors).forEach((name) => {
    const field = document.querySelector(`#order-form [name="${name}"]`)?.closest(".field");
    if (field) {
      field.classList.add("has-error");
      field.querySelector(".error-text").textContent = errors[name];
    }
  });
}

function goToRecap() {
  const values = readFormValues();
  const errors = validateClientSide(values);
  if (Object.keys(errors).length) {
    applyFieldErrors(errors);
    return;
  }

  document.getElementById("recap-list").innerHTML = `
    <li><span>Produit</span><span>${currentProduct.name}</span></li>
    <li><span>ID Free Fire</span><span>${values.freeFireId}</span></li>
    <li><span>Nom</span><span>${values.customerName}</span></li>
    <li><span>Téléphone</span><span>${values.customerPhone}</span></li>
    <li><span>E-mail</span><span>${values.customerEmail}</span></li>
  `;
  document.getElementById("recap-total-value").textContent = formatFcfa(currentProduct.price);

  showStep(2);
}

async function submitOrderAndPay() {
  const payButton = document.getElementById("pay-now-btn");
  const values = readFormValues();

  payButton.disabled = true;
  payButton.innerHTML = `<span class="spinner"></span> Traitement...`;

  try {
    const { order } = await api.createOrder(values);
    const { paymentUrl } = await api.initiatePayment(order.orderNumber);

    // On garde une trace locale pour permettre au client de retrouver sa
    // commande depuis la page de confirmation même si l'URL de retour
    // n'inclut pas tous les paramètres.
    sessionStorage.setItem("momoTechLastOrder", JSON.stringify({
      orderNumber: order.orderNumber,
      email: values.customerEmail,
    }));

    window.location.href = paymentUrl;
  } catch (err) {
    showToast(err.message || "Le paiement n'a pas pu être initié. Réessaie.", "error");
    payButton.disabled = false;
    payButton.textContent = "Payer maintenant";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("order-modal-close")?.addEventListener("click", closeOrderModal);
  overlay()?.addEventListener("click", (e) => {
    if (e.target === overlay()) closeOrderModal();
  });
  document.getElementById("order-next-btn")?.addEventListener("click", goToRecap);
  document.getElementById("order-back-btn")?.addEventListener("click", () => showStep(1));
  document.getElementById("pay-now-btn")?.addEventListener("click", submitOrderAndPay);
  document.getElementById("order-form")?.addEventListener("submit", (e) => e.preventDefault());
});
