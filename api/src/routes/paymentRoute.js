const express = require("express");
const CardPayment = require("../controller/Payment/CardPayment");
const FpxPayment = require("../controller/Payment/FpxPayment");

const router = express.Router();

router.post("/payByCard", CardPayment.createCardPayment);
router.post("/payByFPX", FpxPayment.createFpxPayment);

module.exports = router;
