const express = require("express");
const CardPayment = require("../controller/Payment/CardPayment");
const FpxPayment = require("../controller/Payment/FpxPayment");
const GetPayment = require("../controller/Payment/GetPayment");
const RedirectPayment = require("../controller/Payment/RedirectPayment");

const router = express.Router();

router.get("/paymentMethods", GetPayment.getPaymentMethods);
router.get("/adyen/redirect", RedirectPayment.redirectPayment);
router.post("/payByCard", CardPayment.createCardPayment);
router.post("/payByFPX", FpxPayment.createFpxPayment);

module.exports = router;
