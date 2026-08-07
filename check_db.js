import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1BfjKbFCeAZj-nIVNDffCLCV7yr8qQ6I",
  authDomain: "website-coaching-6be94.firebaseapp.com",
  projectId: "website-coaching-6be94",
  storageBucket: "website-coaching-6be94.firebasestorage.app",
  messagingSenderId: "689793425367",
  appId: "1:689793425367:web:ef2e0156e01256d002b592"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const docRef = doc(db, 'coaching', 'content');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log(JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log("No such document!");
  }
}
check().catch(console.error);
