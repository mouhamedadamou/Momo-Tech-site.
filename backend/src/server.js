require("dotenv").config();
require("./config/db"); // initialise la base + le schéma au démarrage
const app = require("./app");

const PORT = process.env.PORT || 4000;
const bcrypt = require("bcryptjs");
const { countAdmins, createAdmin } = require("./models/adminModel");

if (
  process.env.ADMIN_EMAIL &&
  process.env.ADMIN_PASSWORD &&
  countAdmins() === 0
) {
  const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
  createAdmin(
    process.env.ADMIN_EMAIL.trim().toLowerCase(),
    passwordHash
  );
  console.log("Compte administrateur initial créé.");
}
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Momo Tech API démarrée sur http://localhost:${PORT}`);
});
