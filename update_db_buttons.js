import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function update() {
  const docRef = doc(db, 'coaching', 'content');
  await setDoc(docRef, {
    aboutBtnMoreText: "Lees mijn verhaal",
    aboutBtnLessText: "Minder weergeven",
    consultationBtnMoreText: "ontdek mijn visie op ouderschap",
    consultationBtnLessText: "Verberg mijn visie",
    servicesInterestBtnText: "Ja, ik wil een gratis kennismaking",
    servicesLessBtnText: "Minder info",
    contactSubmitBtnText: "Verstuur Bericht"
  }, { merge: true });
  console.log("Database buttons updated successfully");
}
update().catch(console.error);
