/**
 * Crée un compte administrateur en ligne de commande.
 * Usage : node scripts/createAdmin.js
 */
require("dotenv").config();
const readline = require("readline");
const bcrypt = require("bcryptjs");
const db = require("../src/config/db"); // eslint-disable-line no-unused-vars
const { createAdmin, getAdminByEmail } = require("../src/models/adminModel");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log("=== Création d'un compte administrateur Momo Tech ===");

  const email = (await ask("Email admin : ")).trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Email invalide.");
    process.exit(1);
  }

  if (getAdminByEmail(email)) {
    console.error("Un admin existe déjà avec cet email.");
    process.exit(1);
  }

  const password = await ask("Mot de passe (12 caractères minimum recommandé) : ");
  if (!password || password.length < 8) {
    console.error("Mot de passe trop court (8 caractères minimum).");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = createAdmin(email, passwordHash);

  console.log(`Compte admin créé : ${admin.email} (id ${admin.id})`);
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
