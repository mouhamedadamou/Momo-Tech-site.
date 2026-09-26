const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { errorHandler } = require("./middleware/validate");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());
// PayDunya peut poster l'IPN en formulaire encodé selon la config du
// compte — on accepte les deux formats sur toute l'API.
app.use(express.urlencoded({ extended: true }));

// Limite le rythme des tentatives de connexion admin pour freiner le
// brute-force.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use("/api/auth/login", loginLimiter);

// Limite le rythme de création de commandes pour freiner l'abus.
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use("/api/orders", orderLimiter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ error: "Route inconnue." }));
app.use(errorHandler);

module.exports = app;
