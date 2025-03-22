const admin = require("firebase-admin");
const dotenv = require("dotenv");

let serviceAccount = require("../.firebase/service_account.json");
admin.initializeApp({
  credential: serviceAccount,
});

const db = admin.firestore();

module.exports = { db };
