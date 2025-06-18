const { admin, db } = require("../../config/firebase");

class AdyenWebhook {
  async paymentWebhook(req, res) {
    try {
      const notification = req.body;

      // Verify HMAC signature
      if (!verifyHmacSignature(notification)) {
        console.error("Invalid HMAC signature");
        return res.status(401).json({ error: "Invalid HMAC signature" });
      }

      const notificationItem =
        notification.notificationItems[0].NotificationRequestItem;
      const { merchantReference, eventCode, pspReference, success } =
        notificationItem;

      const [userId, orderId] = merchantReference.split("_");

      if (!userId || !orderId) {
        console.error("Invalid merchantReference format");
        return res
          .status(400)
          .json({ error: "Invalid merchantReference format" });
      }

      console.log(
        `Webhook received: ${eventCode} for order ${merchantReference}`
      );

      // Update order status based on webhook event
      const orderRef = db
        .collection("orders")
        .doc(userId)
        .collection("orders")
        .doc(orderId);

      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        console.error(`Order not found: ${merchantReference}`);
        return res.status(404).json({ error: "Order not found" });
      }

      const updateData = {
        payment: {
          pspReference: pspReference,
          status: "",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      };

      // Handle different event codes
      switch (eventCode) {
        case "AUTHORISATION":
          if (success === "true") {
            updateData.status = "paid";
            updateData.payment.status = "authorised";
          } else {
            updateData.status = "failed";
            updateData.payment.status = "failed";
          }
          break;
        case "CAPTURE":
          if (success === "true") {
            updateData.status = "settled"; // or keep as "paid" if you prefer
            updateData.payment.status = "settled";
            updateData.payment.settledAt =
              admin.firestore.FieldValue.serverTimestamp();
            console.log(`Payment settled for order ${merchantReference}`);
          } else {
            updateData.status = "capture_failed";
            updateData.payment.status = "capture_failed";
          }
          break;
        case "CANCELLATION":
          if (success === "true") {
            updateData.status = "cancelled";
            updateData.payment.status = "cancelled";
          }
          break;
        case "REFUND":
          if (success === "true") {
            updateData.status = "refunded";
            updateData.payment.status = "refunded";
          }
          break;
        default:
          // Acknowledge but don't process unsupported events
          console.log(`Unhandled event: ${eventCode}`);
          return res.json({ "[accepted]": true });
      }

      await orderRef.update(updateData);

      // Always return [accepted] for successful webhook processing
      res.json({ "[accepted]": true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
}

function verifyHmacSignature(notification) {
  const hmacKey = process.env.ADYEN_HMAC_KEY;
  if (!hmacKey) {
    console.error("HMAC key not configured");
    return false;
  }

  try {
    const notificationItem =
      notification.notificationItems[0].NotificationRequestItem;
    const {
      pspReference,
      originalReference,
      merchantAccountCode,
      merchantReference,
      amount,
      eventCode,
      success,
    } = notificationItem;

    // Extract value and currency from amount object
    const value = amount?.value || "";
    const currency = amount?.currency || "";

    // Build the data string for HMAC calculation in the exact order Adyen expects
    const dataToSign = [
      pspReference || "",
      originalReference || "",
      merchantAccountCode || "",
      merchantReference || "",
      value.toString(), // Convert to string
      currency || "",
      eventCode || "",
      success || "",
    ].join(":");

    console.log("Data to sign:", dataToSign); // Debug log

    // Calculate HMAC
    const calculatedHmac = crypto
      .createHmac("sha256", Buffer.from(hmacKey, "hex"))
      .update(dataToSign, "utf8")
      .digest("base64");

    // Get the provided HMAC from notification
    const providedHmac = notificationItem.additionalData?.hmacSignature;

    if (!providedHmac) {
      console.error("No HMAC signature provided in notification");
      return false;
    }

    console.log("Calculated HMAC:", calculatedHmac); // Debug log
    console.log("Provided HMAC:", providedHmac); // Debug log

    // Use timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(calculatedHmac),
      Buffer.from(providedHmac)
    );

    console.log("HMAC verification result:", isValid); // Debug log
    return isValid;
  } catch (error) {
    console.error("Error verifying HMAC signature:", error);
    return false;
  }
}

module.exports = new AdyenWebhook();
