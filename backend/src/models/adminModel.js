const db = require("../config/db");

function getAdminByEmail(email) {
  return db.prepare("SELECT * FROM admins WHERE email = ?").get(email);
}

function createAdmin(email, passwordHash) {
  const stmt = db.prepare("INSERT INTO admins (email, password_hash) VALUES (?, ?)");
  const result = stmt.run(email, passwordHash);
  return db.prepare("SELECT id, email, created_at FROM admins WHERE id = ?").get(result.lastInsertRowid);
}

function countAdmins() {
  return db.prepare("SELECT COUNT(*) AS count FROM admins").get().count;
}

module.exports = { getAdminByEmail, createAdmin, countAdmins };
