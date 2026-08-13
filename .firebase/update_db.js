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

const text1 = `Nadat ik in 2009 afstudeerde aan de Arteveldehogeschool als kleuterleidster, heb ik jarenlang met veel plezier voor de klas gestaan. Van de jongste peuters van 2,5 jaar tot de 6-jarigen. Er is niets mooiers dan werken met mensjes die zo puur en oprecht zijn.

Toch begon ik na een tijdje te voelen dat ik meer wilde doen. In de dynamiek van een kleuterklas zag ik hoe divers de rugzakjes waren die kinderen met zich meedroegen. Vooral de kinderen die het thuis moeilijk hadden, raakten mij. Om die reden besloot ik in 2017 om terug te gaan studeren. Aan de Arteveldehogeschool rondde ik 3 jaar later de bachelor-na-bachelor opleiding 'Zorgverbreding en remediërend leren' af.

Tijdens mijn specialisatie in de module 'Jonge kinderen met gedragsproblemen' viel voor mij alles op zijn plaats. Ik stelde vast dat de focus vaak ligt op kinderen met externaliserend gedrag: zij die hun onmacht uiten via ongehoorzaamheid of agressie. Maar er is nog een groep die we vaak onbedoeld over het hoofd zien: de kinderen met internaliserend gedrag. Zij die hun strijd naar binnen richten en kampen met teruggetrokkenheid, onzekerheid en zelfkritiek. In de klas worden ze vaak bestempeld als stil, dromerig of simpelweg flink. In die beschrijving herkende ik mijn eigen innerlijke kind. Zo vond ik mijn persoonlijke waarheid, maar ook mijn professionele roeping.`;

const text2 = `Toen ik veertig werd, kwam er een kantelpunt. Na het verkennen van nieuwe wegen en een periode van reflectie en groei, kwam coaching op mijn pad. Tijdens mijn opleiding voelde ik meteen: dit is het. Mensen begeleiden in hun groei, geeft mij voldoening.

Ik heb jarenlang geworsteld met het gevoel 'niet goed genoeg' te zijn. Op volwassen leeftijd uitte zich dat in patronen waar ik niet trots op was: een kort lontje, defensief reageren en moeite met echte verbinding. Op een bepaald moment besefte ik dat er iets moest veranderen. Ik ben toen door een proces van reflectie en groei gegaan. Ik weet uit ervaring hoe bevrijdend het is om patronen te doorbreken.

Mijn eigen bevrijding uit die patronen vormt het hart van mijn praktijk. Mijn missie is voorkomen dat oude patronen worden overgedragen op de kinderen van vandaag.`;

async function update() {
  const docRef = doc(db, 'coaching', 'content');
  await setDoc(docRef, { aboutText1: text1, aboutText2: text2 }, { merge: true });
  console.log("Database updated successfully");
}
update().catch(console.error);
