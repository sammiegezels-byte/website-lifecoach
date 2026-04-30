import React, { useState } from 'react';
import { motion } from 'framer-motion';

const questions = [
  {
    question: "Als je met vrienden op vakantie gaat, welke rol neem jij dan op je?",
    options: [
      { text: "Leider: Ik neem graag beslissingen en heb de leiding.", type: "leider" },
      { text: "Ideeën-persoon: Ik ontdek graag unieke plekken en plan nieuwe avonturen.", type: "creatief" },
      { text: "Onderzoeker: Ik lees graag recensies en reisblogs om de beste keuzes te maken.", type: "analyticus" },
      { text: "Motivator: Ik moedig aan, verspil geen tijd en zorg voor de beste ervaring.", type: "aanjager" },
      { text: "Organisator: Ik plan alles: de reis, de route en de verblijven. Alles moet soepel verlopen.", type: "organisator" },
      { text: "Kampleider: Ik check bij iedereen of ze het naar hun zin hebben en breng de groep samen.", type: "verbinder" }
    ]
  },
  {
    question: "Welke rol neem je graag aan in werkrelaties?",
    options: [
      { text: "Ik stuur graag dingen aan, als expert (alleen) of als manager (met een team).", type: "leider" },
      { text: "Ik werk het liefst aan creatieve projecten - soms alleen en soms met anderen.", type: "creatief" },
      { text: "Ik stel graag vragen, doe onderzoek en wil systemen diepgaand begrijpen.", type: "analyticus" },
      { text: "Ik wil graag erkenning voor mijn prestaties. Ik streef ernaar de beste te zijn.", type: "aanjager" },
      { text: "Ik organiseer graag: schema's maken en plannen.", type: "organisator" },
      { text: "Ik hou van relaties en samenwerking. Dat is mijn favoriete deel van werken.", type: "verbinder" }
    ]
  },
  {
    question: "Wat is jouw favoriete manier van organiseren en plannen op werk?",
    options: [
      { text: "Ik neem graag de leiding over hoe dingen georganiseerd worden.", type: "leider" },
      { text: "Ik organiseer graag op een creatieve of visuele manier (kleurcodes, etc).", type: "creatief" },
      { text: "Ik werk graag met spreadsheets, onderzoek of cijfers om info te structureren.", type: "analyticus" },
      { text: "Ik wil dingen snel afronden en hou van het gevoel van prestatie.", type: "aanjager" },
      { text: "Ik maak graag to-do lijstjes en tijdlijnen zodat projecten overzichtelijk zijn.", type: "organisator" },
      { text: "Ik werk graag samen met anderen als een groep.", type: "verbinder" }
    ]
  },
  {
    question: "Hoe werk jij het liefst met data, onderzoek en rapportages?",
    options: [
      { text: "Ik wil de leiding hebben, zodat het onderzoek in het grote plaatje past.", type: "leider" },
      { text: "Ik vind het leuk, zolang het creatief is (kleurrijke grafieken, brainstormen).", type: "creatief" },
      { text: "Ik hou ervan! Ik kan de hele dag informatie analyseren en gelukkig zijn.", type: "analyticus" },
      { text: "Ik wil beslissingen nemen en vooruitgaan - niet te lang blijven hangen.", type: "aanjager" },
      { text: "Het plannen en organiseren is mijn favoriete onderdeel hiervan.", type: "organisator" },
      { text: "Ik werk het liefst samen met anderen om informatie te verzamelen.", type: "verbinder" }
    ]
  },
  {
    question: "Welke rol neem je aan bij een creatief project?",
    options: [
      { text: "Ik wil leiden - zelfs als ik niet creëer, hou ik het grote overzicht.", type: "leider" },
      { text: "Creativiteit is mijn ding! Ik ben graag betrokken bij alle creatieve aspecten.", type: "creatief" },
      { text: "Ik pak de analytische rol: het budget of de onderzoeksdata bekijken.", type: "analyticus" },
      { text: "Ik werk hard om te zorgen dat het project afkomt en vier de resultaten.", type: "aanjager" },
      { text: "Ik maak graag de tijdlijn, organiseer de onderdelen en bewaak de deadline.", type: "organisator" },
      { text: "Ik werk graag samen met anderen om ideeën te brainstormen.", type: "verbinder" }
    ]
  },
  {
    question: "Hoe detailgericht ben jij?",
    options: [
      { text: "Ik ben meer van het grote geheel en delegeer de details liever.", type: "leider" },
      { text: "Ik let op creatieve details, maar andere details vind ik al snel saai.", type: "creatief" },
      { text: "Details zijn belangrijk. Ik ben goed in het vinden van foutjes en onjuistheden.", type: "analyticus" },
      { text: "Ik ben meer geïnteresseerd in vooruitgang boeken dan verstrikt raken in details.", type: "aanjager" },
      { text: "Ik plan graag de belangrijke details zodat alles soepel loopt.", type: "organisator" },
      { text: "Ik werk graag met anderen om de details in gezamenlijk overleg op te lossen.", type: "verbinder" }
    ]
  },
  {
    question: "Welke rol speel jij het liefst bij het samenwerken met leiders/management?",
    options: [
      { text: "Ik ben graag onderdeel van de grote strategische beslissingen.", type: "leider" },
      { text: "Ik bedenk graag creatieve ideeën die het management kan implementeren.", type: "creatief" },
      { text: "Ik analyseer data zodat de leiding beter geïnformeerde beslissingen kan nemen.", type: "analyticus" },
      { text: "Ik help graag om dingen snel vooruit te helpen naar grote prestaties.", type: "aanjager" },
      { text: "Ik plan graag de tijdlijnen en het stap-voor-stap proces uit.", type: "organisator" },
      { text: "Ik werk liever samen met mensen op mijn eigen niveau.", type: "verbinder" }
    ]
  },
  {
    question: "Wat is jouw geheime verlangen in je carrière?",
    options: [
      { text: "Ik wil de leiding en verantwoordelijkheid hebben over beslissingen.", type: "leider" },
      { text: "Ik wil creatiever en fantasierijker zijn.", type: "creatief" },
      { text: "Ik wil meer tijd hebben om informatie te analyseren en onderzoeken.", type: "analyticus" },
      { text: "Ik wil meer bereiken, successen vieren en erkenning krijgen.", type: "aanjager" },
      { text: "Ik wil systemen creëren, processen opzetten en strakke tijdlijnen bewaken.", type: "organisator" },
      { text: "Ik wil echt een verschil maken in het leven van anderen en in teamverband werken.", type: "verbinder" }
    ]
  }
];

const resultsContent = {
  leider: { title: "De Leider", desc: "Jij bent een natuurlijke leider. Je neemt graag de controle, overziet het grote plaatje en stuurt mensen met vertrouwen de juiste richting in." },
  creatief: { title: "De Creatieve Ziener", desc: "Jij brengt kleur en innovatie in elke situatie. Je hersens werken buiten de gebaande paden en je komt met de beste out-of-the-box oplossingen." },
  analyticus: { title: "De Analytische Denker", desc: "Jij bent de ruggengraat van weloverwogen beslissingen. Door jouw scherpe blik op data en feiten worden de beste keuzes gemaakt." },
  aanjager: { title: "De Aanjager", desc: "Jij krijgt dingen gedaan! Je bent resultaatgericht, viert successen en zorgt ervoor dat projecten niet stagneren maar keihard vooruit gaan." },
  organisator: { title: "De Organisator", desc: "Chaos bestaat niet in jouw woordenboek. Met jouw to-do lijstjes, schema's en planningen loopt alles altijd op rolletjes." },
  verbinder: { title: "De Verbinder", desc: "Mensen zijn jouw kracht. Je brengt teams samen, zorgt voor harmonie en haalt de beste communicatie en samenwerking in iedereen naar boven." }
};

export default function Quiz() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [scores, setScores] = useState({ leider: 0, creatief: 0, analyticus: 0, aanjager: 0, organisator: 0, verbinder: 0 });
  const [result, setResult] = useState(null);

  const handleStart = () => {
    setCurrentStep(0);
    setScores({ leider: 0, creatief: 0, analyticus: 0, aanjager: 0, organisator: 0, verbinder: 0 });
    setResult(null);
  };

  const handleAnswer = (type) => {
    const newScores = { ...scores, [type]: scores[type] + 1 };
    setScores(newScores);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate result
      let highestType = Object.keys(newScores).reduce((a, b) => newScores[a] > newScores[b] ? a : b);
      setResult(highestType);
    }
  };

  if (result) {
    const res = resultsContent[result];
    return (
      <div className="quiz-container">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <h3 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Jouw Carrière-Persoonlijkheid is:</h3>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{res.title}</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{res.desc}</p>
          
          <div style={{ padding: '1.5rem', background: '#f5f5f5', borderRadius: '12px', marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Wat betekent dit voor jou?</h4>
            <p style={{ fontSize: '0.9rem', color: '#555' }}>
              Wil je weten hoe je deze kracht het beste kunt inzetten in je huidige of nieuwe baan? 
              Laten we samen kijken naar jouw volgende stap.
            </p>
          </div>

          <a href="#contact" className="btn" onClick={() => setCurrentStep(-1)}>Bespreek je resultaat gratis</a>
          <button onClick={handleStart} className="btn btn-outline" style={{ marginLeft: '1rem' }}>Doe de test opnieuw</button>
        </motion.div>
      </div>
    );
  }

  if (currentStep === -1) {
    return (
      <div className="quiz-container" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem', color: 'var(--color-text)' }}>Wat is jouw carrière-persoonlijkheid?</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Voel je je verward over de volgende stap in je carrière? Deze quiz helpt je jouw sterke punten en potentieel te ontdekken. Zo vind je de richting en motivatie om vol vertrouwen naar de toekomst te bewegen.
        </p>
        <button onClick={handleStart} className="btn">Start de Quiz</button>
      </div>
    );
  }

  const q = questions[currentStep];

  return (
    <div className="quiz-container">
      <div style={{ marginBottom: '2rem', color: 'var(--color-text-light)', fontWeight: 'bold' }}>
        Vraag {currentStep + 1} van {questions.length}
      </div>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>{q.question}</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {q.options.map((opt, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAnswer(opt.type)}
            style={{
              padding: '1rem 1.5rem',
              textAlign: 'left',
              border: '2px solid var(--color-primary)',
              borderRadius: '8px',
              background: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
              color: 'var(--color-text)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
          >
            {opt.text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
