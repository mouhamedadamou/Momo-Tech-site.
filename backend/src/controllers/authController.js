const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getAdminByEmail } = require("../models/adminModel");

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  const admin = getAdminByEmail(String(email).toLowerCase().trim());
  if (!admin) {
    // Message volontairement générique pour ne pas confirmer l'existence
    // d'un compte.
    return res.status(401).json({ error: "Identifiants incorrects." });
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Identifiants incorrects." });
  }

  const token = jwt.sign(
    { sub: admin.id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

  res.json({ token, admin: { id: admin.id, email: admin.email } });
}

module.exports = { login };
