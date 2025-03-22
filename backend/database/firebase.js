const admin = require("firebase-admin");

let serviceAccount = require("../.firebase/service_account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { db };
