import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "eiwittens.firebaseapp.com",
  projectId: "eiwittens",
  storageBucket: "eiwittens.appspot.com",
  messagingSenderId: "16129604687",
  appId: "1:16129604687:web:58aaba92824a669a273e3a",
  measurementId: "G-CWC403YJDZ",
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
