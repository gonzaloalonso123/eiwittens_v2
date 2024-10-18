const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

module.exports = { db };
