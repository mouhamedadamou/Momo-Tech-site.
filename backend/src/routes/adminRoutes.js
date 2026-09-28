const express = require("express");
const { requireAdminAuth } = require("../middleware/auth");
const { listOrders, getStats, updateOrderStatus, deleteOrder } = require("../controllers/adminController");

const router = express.Router();

// Toutes les routes admin exigent un token JWT valide.
router.use(requireAdminAuth);

router.get("/orders", listOrders);
router.get("/stats", getStats);
router.patch("/orders/:orderNumber/status", updateOrderStatus);
router.delete("/orders/:orderNumber", deleteOrder);
module.exports = router;
