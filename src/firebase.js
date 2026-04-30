import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1BfjKbFCeAZj-nIVNDffCLCV7yr8qQ6I",
  authDomain: "website-coaching-6be94.firebaseapp.com",
  projectId: "website-coaching-6be94",
  storageBucket: "website-coaching-6be94.firebasestorage.app",
  messagingSenderId: "689793425367",
  appId: "1:689793425367:web:ef2e0156e01256d002b592"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
