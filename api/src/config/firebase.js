const admin = require("firebase-admin");
const serviceAccount = require("./mycrochetbag-47372-firebase-adminsdk-fbsvc-d7a6872f95.json"); // adjust this path

// Prevent multiple initializations
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();
module.exports = { admin, db };
