const { checkout } = require("../../config/adyen");
const { v4: uuidv4 } = require("uuid");

class GetPayment {
  async getPaymentMethods(req, res) {
    const idempotencyKey = uuidv4();

    const amountInCents = parseInt(req.query.amount, 10) * 100;

    if (isNaN(amountInCents) || amountInCents <= 0) {
      return res
        .status(400)
        .json({ error: `Invalid or missing amount parameter ${req.amount}` });
    }

    const amount = {
      currency: "MYR",
      value: amountInCents,
    };

    const paymentMethodsRequest = {
      amount: amount,
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
      countryCode: "MY",
      channel: "Android",
      shopperLocale: "en-MY",
    };

    try {
      const response = await checkout.PaymentsApi.paymentMethods(
        paymentMethodsRequest,
        {
          amount: amount.currency,
          idempotencyKey: idempotencyKey,
        }
      );
      res.json(response);
    } catch (error) {
      console.error(
        "Payment error:",
        error.response?.body || error.message || error
      );
      res.status(500).json({ error: error.response?.body || error.message });
    }
  }
}

module.exports = new GetPayment();
