const express = require("express");
const AdyenWebhook = require("../controller/Webhook/AdyenWebhook");

const router = express.Router();

router.post("/payment", AdyenWebhook.paymentWebhook);

module.exports = router;
