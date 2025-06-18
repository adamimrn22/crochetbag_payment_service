const { admin, db } = require("../../config/firebase");
const { checkout } = require("../../config/adyen");
const calculateTotal = require("../../utils/calculateTotal");

class FpxPayment {
  async createFpxPayment(req, res) {
    const { userId, address, orders, issuer } = req.body;

    // Validate request
    if (!userId || !address || !orders || !issuer) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Generate a new order ID from Firestore
      const orderId = db.collection("orders").doc().id;

      // Construct the merchantReference after orderId is created
      const merchantReference = `${userId}_${orderId}`;
      let amount = calculateTotal(orders);

      // Create the payment request
      const paymentRequest = {
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
        reference: merchantReference,
        amount: { value: Math.round(amount * 100), currency: "MYR" },
        paymentMethod: {
          type: "molpay_ebanking_fpx_MY",
          issuer: issuer,
        },
        countryCode: "MY",
        returnUrl: `${process.env.BASE_URL}/api/payment/adyen/redirect`,
        channel: "Android",
        shopperLocale: "en_MY",
      };

      // Create the order in Firestore
      const orderRef = db
        .collection("orders")
        .doc(userId)
        .collection("orders")
        .doc(orderId);

      await orderRef.set({
        userId,
        address,
        orders,
        status: "pending",
        amount: amount,
        payment: null,
        paymentType: "FPX",
        merchantReference,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Call Adyen API to initiate payment
      const response = await checkout.PaymentsApi.payments(paymentRequest);

      console.log("Adyen Response:", JSON.stringify(response, null, 2));

      // Respond with the Adyen response
      res.json(response);
    } catch (error) {
      console.error("Adyen Error:", error.message, error.response?.body);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new FpxPayment();
