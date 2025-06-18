const express = require("express");
const router = express.Router();

router.use("/api/payment", require("./paymentRoute"));
router.use("/api/webhook", require("./webhookRoute"));

module.exports = router;
