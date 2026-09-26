const express = require("express");
const { createOrder, getOrderStatus } = require("../controllers/orderController");

const router = express.Router();

router.post("/", createOrder);
router.get("/:orderNumber", getOrderStatus);

module.exports = router;
