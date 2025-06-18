const { admin, db } = require("../../config/firebase");
const { checkout } = require("../../config/adyen");
const calculateTotal = require("../../utils/calculateTotal");

class CardPayment {
  async createCardPayment(req, res) {
    try {
      const { userId, address, orders, paymentMethod } = req.body;

      // Validate request
      if (!userId || !address || !orders || !paymentMethod) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate paymentMethod structure
      if (typeof paymentMethod !== "object" || !paymentMethod.type) {
        return res.status(400).json({
          error:
            "Invalid payment method format. Expected object with 'type' field",
        });
      }

      // Test Account
      const paymentType = {
        type: "scheme",
        encryptedCardNumber: `test_${paymentMethod.encryptedCardNumber}`,
        encryptedExpiryMonth: `test_${paymentMethod.encryptedExpiryMonth}`,
        encryptedExpiryYear: `test_${paymentMethod.encryptedExpiryYear}`,
        encryptedSecurityCode: `test_${paymentMethod.encryptedSecurityCode}`,
      };

      // Create order in Firestore
      const orderId = db.collection("orders").doc().id;

      const orderRef = db
        .collection("orders")
        .doc(userId)
        .collection("orders")
        .doc(orderId);

      const merchantReference = `${userId}_${orderId}`;

      let amount = calculateTotal(orders);

      // Create the order in Firestore
      await orderRef.set({
        userId,
        address,
        orders,
        status: "pending",
        amount: amount,
        payment: null,
        paymentType: "CARD",
        merchantReference,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Initiate Adyen payment
      const paymentRequest = {
        amount: {
          currency: "MYR",
          value: Math.round(amount * 100),
        },
        reference: orderId,
        paymentMethod: paymentType,
        returnUrl: `${process.env.APP_URL_SCHEME}://payment-result/${orderId}`,
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
        merchantReference,
        additionalData: {
          allow3DS2: true,
        },
        channel: "Android",
      };

      console.log("Payment request:", JSON.stringify(paymentRequest, null, 2));

      const paymentResponse = await checkout.PaymentsApi.payments(
        paymentRequest
      );

      // Update order with payment details
      await orderRef.update({
        payment: {
          pspReference: paymentResponse.pspReference,
          resultCode: paymentResponse.resultCode,
          status: "initiated",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

      res.json({
        orderId: orderRef.id,
        paymentResponse: {
          resultCode: paymentResponse.resultCode,
          action: paymentResponse.action, // For 3DS or other additional actions
          pspReference: paymentResponse.pspReference,
        },
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        error: "Failed to create order",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = new CardPayment();
