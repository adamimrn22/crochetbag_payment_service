const { Client, CheckoutAPI } = require("@adyen/api-library");

const adyenClient = new Client({
  apiKey: process.env.ADYEN_API_KEY,
  environment: process.env.ADYEN_ENVIRONMENT || "TEST", // "LIVE" for production
});

const checkout = new CheckoutAPI(adyenClient);

module.exports = {
  adyenClient,
  checkout,
};
