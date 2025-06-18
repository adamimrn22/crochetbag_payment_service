const express = require("express");
const CardPayment = require("../controller/Payment/CardPayment");
const FpxPayment = require("../controller/Payment/FpxPayment");
const GetPayment = require("../controller/Payment/GetPayment");

const router = express.Router();

router.get("/paymentMethods", GetPayment.getPaymentMethods);
router.post("/payByCard", CardPayment.createCardPayment);
router.post("/payByFPX", FpxPayment.createFpxPayment);

module.exports = router;
