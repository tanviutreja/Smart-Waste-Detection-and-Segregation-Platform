import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCJ_iE4EUlMATRYGB6Ty4JYx_kw3kkY7Iw",
  authDomain: "smart-waste-detection.firebaseapp.com",
  projectId: "smart-waste-detection",
  storageBucket: "smart-waste-detection.firebasestorage.app",
  messagingSenderId: "83062601861",
  appId: "1:83062601861:web:96c20f96cdbb08630f91ec",
  measurementId: "G-K8RLJ2XBC4"
};

// Initialize Firebase
// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);