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

const newQuestions = [
  { id: 'q1', type: 'text', question: '1. Leeftijd van je kind(eren)' },
  { 
    id: 'q2', 
    type: 'checkbox', 
    question: '2. Waar loop je op dit moment het meest tegenaan?', 
    options: 'Driftbuien / sterke emoties, Grenzen stellen & luisteren, Onzekerheid over mijn eigen aanpak, Balans & rust in het gezin' 
  },
  { id: 'q2_other', type: 'text', question: 'Anders, namelijk: ...' },
  { id: 'q3', type: 'text', question: '3. Waar hoop je dat ik je als coach het beste bij kan helpen?' },
  { 
    id: 'q4', 
    type: 'radio', 
    question: '4. Hoe wil je het liefst gecontacteerd worden?', 
    options: 'E-mail, Telefoon' 
  },
  { id: 'q5', type: 'text', question: '5. Op welke dagen/tijdstippen ben je het beste bereikbaar?' },
  { id: 'q6', type: 'booking', question: '6. Boek hier je moment met mij' }
];

async function update() {
  const docRef = doc(db, 'coaching', 'content');
  await setDoc(docRef, { contactQuestions: newQuestions }, { merge: true });
  console.log("Database questions updated successfully");
}
update().catch(console.error);
