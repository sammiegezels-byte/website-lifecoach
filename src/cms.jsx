import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getActiveSectionOrder, getTrashSectionUpdates, getRestoreSectionUpdates, getPermanentlyRemoveSectionUpdates } from './sectionState';
import './cms-loading.css';

// Default content
const defaultContent = {
  pin: "0000",
  contactEmail: "lindsay@lifestylecoach.nl",
  heroTitle: "LIFE COACHING",
  heroSubtitle: "Ontdek jouw beste versie — voor elk moment in het leven",
  navBtnText: "Stuur Bericht",
  heroBtnText: "Gratis Kennismakingsgesprek",
  consultationTitle: "PLAN EEN GRATIS GESPREK VAN 30 MINUTEN",
  consultationText: "Laten we samen praten over jouw leven, jouw dromen en de uitdagingen die je tegenhouden. Of je nu vastloopt, een nieuwe richting zoekt of gewoon meer balans wil — ik help jou verder. Kinderen, jongeren, ouders, volwassenen: iedereen is welkom.",
  quoteText: "Vind een leven dat past bij wie jij écht bent.",
  consultationBtnText: "Plan Nu",
  servicesTitle: "WERK MET MIJ",
  servicesMainVideo: "",
  servicesMainImage: "/images/hero_bg_1777508859798.png",
  servicesMainBtnText: "Meer info over mijn werkwijze",
  card1Title: "LEVENSRICHTING",
  card1Text: "Ontdek wie je bent en wat je wil. We verkennen jouw passies, sterktes en dromen.",
  card2Title: "GEZIN & RELATIES",
  card2Text: "Betere communicatie, meer verbinding. Voor ouders, koppels en gezinnen die sterker willen staan.",
  card3Title: "1:1 LIFE COACHING",
  card3Text: "Persoonlijke begeleiding op maat. Samen werken we aan jouw groei, balans en geluk.",
  servicesBtnText: "Meer info",
  aboutTitle: "Hallo! Ik ben Lindsay Battiau,",
  aboutText1: "Life coach met een passie voor mensen. Ik begeleid kinderen, jongeren, ouders en volwassenen bij de uitdagingen van het leven.",
  aboutText2: "Of je nu zoekt naar meer richting, meer balans of gewoon iemand nodig hebt die écht luistert — je bent hier aan het juiste adres. Mijn aanpak is warm, persoonlijk en volledig op maat.",
  contactTitle: "LATEN WE PRATEN",
  contactSubtitle: "Heb je vragen? Stuur me een berichtje!",
  contactQuestions: [
    { id: 'q1', type: 'text', question: '1. Leeftijd van je kind(eren)' },
    { id: 'q2', type: 'checkbox', question: '2. Waar loop je op dit moment het meest tegenaan?', options: 'Driftbuien / sterke emoties, Grenzen stellen & luisteren, Onzekerheid over mijn eigen aanpak, Balans & rust in het gezin' },
    { id: 'q2_other', type: 'text', question: 'Anders, namelijk: ...' },
    { id: 'q3', type: 'text', question: '3. Waar hoop je dat ik je als coach het beste bij kan helpen?' },
    { id: 'q4', type: 'radio', question: '4. Hoe wil je het liefst gecontacteerd worden?', options: 'E-mail, Telefoon' },
    { id: 'q5', type: 'text', question: '5. Op welke dagen/tijdstippen ben je het beste bereikbaar?' },
    { id: 'q6', type: 'booking', question: '6. Boek hier je moment met mij' }
  ],
  availableSlots: [],
  privacyDisclaimer: "Jouw gegevens worden vertrouwelijk behandeld en nooit gedeeld met derden.",
  footerLogo: "Lifestyle Coach",
  footerCopyright: "© 2025 Lifestyle Coach — Alle rechten voorbehouden",
  heroImage: "/images/hero_bg_1777508859798.png",
  consultationImage: "/images/consultation_img_1777508875834.png",
  card1Image: "/images/card1_img_1777508888413.png",
  card2Image: "/images/card2_img_1777508902620.png",
  card3Image: "/images/card3_img_1777508915027.png",
  aboutImage: "/images/about_me_img_1777508927144.png",
  quoteImage: "/images/quote_bg_1777515862508.png",
  contactImage: "/images/contact_bg_1777516360136.png",
  parallax1Image: "/images/parallax_1.png",
  parallax2Image: "/images/parallax_2.png",
  instagramLink: "https://instagram.com",
  facebookLink: "https://facebook.com",
  linkedinLink: "https://linkedin.com",
  themeHeadingFont: "Playfair Display",
  themeBodyFont: "Inter",
  themeColor: "#8FAF8F",
  animationsEnabled: true,
  sectionOrder: ['home', 'over-mij', 'visie', 'werk-met-mij', 'aanbod', 'contact'],
  seoTitle: "Oudercoach | Lindsay Battiau",
  seoDescription: "Oudercoach Lindsay Battiau helpt ouders patronen te doorbreken voor meer rust in huis en verbinding. Plan een gratis kennismaking.",
  seoRegion: "Serskamp, Oost-Vlaanderen, België (en omstreken / online)",
  seoKeywords: "oudercoach, life coach, opvoeding, rust in huis, driftbuien, gezinscoach, Serskamp, Oost-Vlaanderen, Wichelen, Wetteren, Lede, Aalst, Dendermonde, Gent",
  customSections: [],
  aboutBtnMoreText: "Lees mijn verhaal",
  aboutBtnLessText: "Minder weergeven",
  consultationBtnMoreText: "ontdek mijn visie op ouderschap",
  consultationBtnLessText: "Verberg mijn visie",
  servicesInterestBtnText: "Ja, ik wil een gratis kennismaking",
  servicesLessBtnText: "Minder info",
  servicesStepsBottomText: "",
  contactSubmitBtnText: "Verstuur Bericht"
};

export const uploadToCloudinary = async (file, resourceType = 'auto') => {
  alert("Bestand wordt geüpload naar Cloudinary... even geduld a.u.b.");
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'coaching_preset'); 
  formData.append('cloud_name', 'dgcsywntf');

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/dgcsywntf/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.secure_url) {
      alert("Bestand succesvol geüpload!");
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || 'Onbekende fout');
    }
  } catch (error) {
    console.error("Upload error", error);
    alert('Upload mislukt: ' + error.message + '\n(Heb je de Upload Preset al aangemaakt in Cloudinary?)');
    return null;
  }
};

const CMSContext = createContext();

export function CMSProvider({ children }) {
  const [content, setContent] = useState(defaultContent);
  const [loadState, setLoadState] = useState({ status: 'loading', message: '' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Show the actual saved website only after the first successful read.
    // Missing content must never overwrite the database with demo content.
    const docRef = doc(db, 'coaching', 'content');
    let receivedContent = false;
    const timeout = window.setTimeout(() => {
      if (!receivedContent) {
        setLoadState({ status: 'error', message: 'Het laden duurt langer dan verwacht. Controleer je internetverbinding en probeer opnieuw.' });
      }
    }, 15000);

    const unsubscribe = onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
      if (docSnap.exists()) {
        receivedContent = true;
        window.clearTimeout(timeout);
        setContent({ ...defaultContent, ...docSnap.data() });
        setLoadState({ status: 'ready', message: '' });
      } else if (!docSnap.metadata.fromCache) {
        window.clearTimeout(timeout);
        setLoadState({ status: 'error', message: 'De website-inhoud is momenteel niet beschikbaar. Probeer het later opnieuw.' });
      }
    }, (error) => {
      console.error("Firebase Snapshot error:", error);
      window.clearTimeout(timeout);
      if (!receivedContent) {
        setLoadState({ status: 'error', message: 'De website kon niet worden geladen. Controleer je internetverbinding en probeer opnieuw.' });
      }
    });

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [loadAttempt]);

  const updateContent = async (key, value) => {
    // Lokale state updaten voor instant feedback (optimistic UI)
    setContent(current => ({ ...current, [key]: value }));
    
    // Direct opslaan in Firestore
    try {
      const docRef = doc(db, 'coaching', 'content');
      await setDoc(docRef, { [key]: value }, { merge: true });
    } catch (error) {
      console.error("Fout bij opslaan in Firebase:", error);
      alert("Fout bij opslaan. Heb je Firebase Firestore regels ingesteld op 'Test mode'?");
    }
  };

  const updateMultiple = useCallback(async (updatesObj) => {
    setContent(current => ({ ...current, ...updatesObj }));
    try {
      const docRef = doc(db, 'coaching', 'content');
      await setDoc(docRef, updatesObj, { merge: true });
    } catch (error) {
      console.error("Fout bij opslaan in Firebase:", error);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const now = Date.now();
    const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;
    const expired = (content.trashedSections || []).filter(section => (now - section.deletedAt) >= FIFTEEN_DAYS);
    if (expired.length > 0) {
      const updates = getPermanentlyRemoveSectionUpdates(content, expired.map(section => section.id));
      // The live listener applies background cleanup once it has been saved.
      setDoc(doc(db, 'coaching', 'content'), updates, { merge: true }).catch(error => {
        console.error('Fout bij opruimen van de prullenbak:', error);
      });
    }
  }, [isAdmin, content]);

  const moveSection = (index, direction) => {
    const sectionOrder = getActiveSectionOrder(content);
    const newOrder = [...sectionOrder];
    if (direction === -1 && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 1 && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    updateMultiple({ sectionOrder: newOrder });
  };

  const addCustomSection = () => {
    const newId = 'custom_' + Date.now();
    const sectionOrder = getActiveSectionOrder(content);
    const newOrder = [...sectionOrder];
    
    newOrder.push(newId);

    const newCustoms = [...(content.customSections || []), { id: newId }];
    updateMultiple({ 
      sectionOrder: newOrder, 
      customSections: newCustoms,
      [`customTitle_${newId}`]: "Nieuwe Pagina",
      [`customText_${newId}`]: "Pas deze tekst aan naar wens.",
      [`customImage_${newId}`]: "/images/about_me_img_1777508927144.png"
    });
  };

  const addParallaxSection = () => {
    const newId = 'parallax_' + Date.now();
    const sectionOrder = getActiveSectionOrder(content);
    const newOrder = [...sectionOrder];
    
    newOrder.push(newId);
    
    updateMultiple({
      sectionOrder: newOrder,
      [`${newId}Image`]: "/images/parallax_1.png",
      [`${newId}Quote`]: "Nieuwe inspirerende quote hier."
    });
  };

  const removeSection = (id) => {
    if (window.confirm("Weet je zeker dat je deze pagina naar de prullenbak wilt verplaatsen? (Blijft 15 dagen bewaard)")) {
      updateMultiple(getTrashSectionUpdates(content, id));
    }
  };

  const restoreSection = (id) => {
    updateMultiple(getRestoreSectionUpdates(content, id));
  };

  const permanentlyRemoveSection = (id) => {
    if (window.confirm("Weet je zeker dat je deze pagina DEFINITIEF wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
      updateMultiple(getPermanentlyRemoveSectionUpdates(content, [id]));
    }
  };

  if (loadState.status !== 'ready') {
    return (
      <main className="cms-loading" aria-busy={loadState.status === 'loading'}>
        {loadState.status === 'loading' ? (
          <>
            <span className="cms-loading-spinner" aria-hidden="true" />
            <p role="status">De website wordt geladen…</p>
          </>
        ) : (
          <>
            <p role="alert">{loadState.message}</p>
            <button type="button" onClick={() => {
              setLoadState({ status: 'loading', message: '' });
              setLoadAttempt(attempt => attempt + 1);
            }}>Opnieuw proberen</button>
          </>
        )}
      </main>
    );
  }

  return (
    <CMSContext.Provider value={{
      content, updateContent, updateMultiple,
      isAdmin, setIsAdmin, 
      showLogin, setShowLogin,
      showSettings, setShowSettings,
      moveSection, addCustomSection, addParallaxSection, removeSection, restoreSection, permanentlyRemoveSection
    }}>
      {children}
    </CMSContext.Provider>
  );
}

export const useCMS = () => useContext(CMSContext);

export function EditableText({ fieldKey, type = "text", multiline = false, className = "", style = {} }) {
  const { content } = useCMS();
  const raw = content[fieldKey] !== undefined && content[fieldKey] !== "" ? content[fieldKey] : (defaultContent[fieldKey] || "");
  const customFont = content[`${fieldKey}Font`];
  const finalStyle = customFont ? { ...style, fontFamily: `"${customFont}", sans-serif` } : style;

  if (multiline) {
    return <div className={className} style={{...finalStyle, whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{__html: raw}} />;
  }
  return <span className={className} style={finalStyle} dangerouslySetInnerHTML={{__html: raw}} />;
}

export function EditableImage({ fieldKey, className = "", style = {}, alt = "" }) {
  const { content } = useCMS();
  const src = content[fieldKey];

  return <img src={src} alt={alt} className={className} style={style} />;
}

export function EditableVideo({ fieldKey, className = "", style = {} }) {
  const { content } = useCMS();
  const src = content[fieldKey];

  if (!src) return null;
  return (
    <video src={src} autoPlay muted playsInline className={className} style={style} />
  );
}
