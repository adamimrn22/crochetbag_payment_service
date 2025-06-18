const { checkout } = require("../../config/adyen");

class GetPayment {
  async getFpxBankIssuer(req, res) {
    const idempotencyKey = uuidv4();

    const amount = {
      currency: "MYR",
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
          amount: amount,
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
