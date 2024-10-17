const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "eiwittens.firebaseapp.com",
  projectId: "eiwittens",
  storageBucket: "eiwittens.appspot.com",
  messagingSenderId: "16129604687",
  appId: "1:16129604687:web:58aaba92824a669a273e3a",
  measurementId: "G-CWC403YJDZ",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
module.exports = { db };
