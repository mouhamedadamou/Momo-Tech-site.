const express = require("express");
const {
  initiatePayment,
  handleIpn,
  refreshPaymentStatus,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/initiate/:orderNumber", initiatePayment);
// PayDunya poste ici en x-www-form-urlencoded ou JSON selon config du
// compte — voir app.js pour les parsers montés sur cette route.
router.post("/ipn", handleIpn);
router.get("/status/:orderNumber", refreshPaymentStatus);

module.exports = router;
