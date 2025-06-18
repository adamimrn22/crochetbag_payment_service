const { admin, db } = require("../../config/firebase");
const { checkout } = require("../../config/adyen");

class RedirectPayment {
  async redirectPayment(req, res) {
    console.log("=== REDIRECT RECEIVED ===");
    console.log("All query parameters:", JSON.stringify(req.query, null, 2));

    const redirectResult = req.query.redirectResult;
    const resultCode = req.query.resultCode;
    let merchantReference = req.query.merchantReference;

    let finalStatus = "unknown";

    try {
      // If we have redirectResult, call Adyen API to get full details
      if (redirectResult) {
        const statusRequest = {
          details: {
            redirectResult: redirectResult,
          },
        };

        const response = await checkout.PaymentsApi.paymentsDetails(
          statusRequest
        );
        console.log("Payment details response:", response);

        // Get merchantReference from API response if not in query params
        if (!merchantReference && response.merchantReference) {
          merchantReference = response.merchantReference;
        }

        // Determine final status from Adyen response
        switch (response.resultCode) {
          case "SentForSettle":
          case "Authorised":
            finalStatus = "paid";
            break;
          case "Refused":
            finalStatus = "failed";
            break;
          case "Cancelled":
            finalStatus = "cancelled";
            break;
          default:
            finalStatus = "unknown";
        }

        // Update database if we have merchantReference
        if (merchantReference) {
          const [userId, orderId] = merchantReference.split("_");

          if (userId && orderId) {
            const orderRef = db
              .collection("orders")
              .doc(userId)
              .collection("orders")
              .doc(orderId);

            const orderDoc = await orderRef.get();

            if (orderDoc.exists) {
              const updateData = {
                status: finalStatus,
                payment: {
                  pspReference: response.pspReference,
                  resultCode: response.resultCode,
                  status: response.resultCode,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              };

              await orderRef.update(updateData);
              console.log(
                `Order ${merchantReference} updated with status: ${finalStatus}`
              );
            } else {
              console.error("❌ Order not found:", merchantReference);
            }
          }
        }
      } else if (resultCode) {
        // Handle direct result code (fallback)
        switch (resultCode.toLowerCase()) {
          case "authorised":
            finalStatus = "paid";
            break;
          case "refused":
            finalStatus = "failed";
            break;
          case "cancelled":
            finalStatus = "cancelled";
            break;
          default:
            finalStatus = "unknown";
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      finalStatus = "error";
    }

    res.redirect(
      `${process.env.APP_URL_SCHEME}://payment-result?status=${
        resultCode || "unknown"
      }&reference=${merchantReference || ""}`
    );
  }
}

module.exports = new RedirectPayment();
