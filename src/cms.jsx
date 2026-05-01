import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// Default content
const defaultContent = {
  pin: "0000",
  contactEmail: "lindsay@lifestylecoach.nl",
  heroTitle: "LIFE COACHING",
  heroSubtitle: "Ontdek jouw beste versie — voor elk moment in het leven",
  navBtnText: "Gratis Gesprek",
  heroBtnText: "Gratis Kennismakingsgesprek",
  consultationTitle: "PLAN EEN GRATIS GESPREK VAN 30 MINUTEN",
  consultationText: "Laten we samen praten over jouw leven, jouw dromen en de uitdagingen die je tegenhouden. Of je nu vastloopt, een nieuwe richting zoekt of gewoon meer balans wil — ik help jou verder. Kinderen, jongeren, ouders, volwassenen: iedereen is welkom.",
  quoteText: "Vind een leven dat past bij wie jij écht bent.",
  consultationBtnText: "Plan Nu",
  servicesTitle: "WERK MET MIJ",
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
  instagramLink: "https://instagram.com",
  facebookLink: "https://facebook.com",
  linkedinLink: "https://linkedin.com"
};

export const uploadImageToCloudinary = async (file) => {
  // We gebruiken een toast/alert voor simpele UX tijdens uploaden
  alert("Foto wordt geüpload naar Cloudinary... even geduld a.u.b.");
  const formData = new FormData();
  formData.append('file', file);
  // LET OP: 'coaching_preset' moet nog worden aangemaakt in Cloudinary!
  formData.append('upload_preset', 'coaching_preset'); 
  formData.append('cloud_name', 'dgcsywntf');

  try {
    const res = await fetch('https://api.cloudinary.com/v1_1/dgcsywntf/image/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.secure_url) {
      alert("Foto succesvol geüpload!");
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Luister live naar Firebase Firestore wijzigingen
    const docRef = doc(db, 'coaching', 'content');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setContent({ ...defaultContent, ...docSnap.data() });
      } else {
        // Document bestaat nog niet in Firebase, maak hem aan met de standaard waarden
        setDoc(docRef, defaultContent);
      }
    }, (error) => {
      console.error("Firebase Snapshot error:", error);
    });

    return () => unsubscribe();
  }, []);

  const updateContent = async (key, value) => {
    // Lokale state updaten voor instant feedback (optimistic UI)
    const newContent = { ...content, [key]: value };
    setContent(newContent);
    
    // Direct opslaan in Firestore
    try {
      const docRef = doc(db, 'coaching', 'content');
      await setDoc(docRef, { [key]: value }, { merge: true });
    } catch (error) {
      console.error("Fout bij opslaan in Firebase:", error);
      alert("Fout bij opslaan. Heb je Firebase Firestore regels ingesteld op 'Test mode'?");
    }
  };

  return (
    <CMSContext.Provider value={{
      content, updateContent, 
      isAdmin, setIsAdmin, 
      showLogin, setShowLogin,
      showSettings, setShowSettings
    }}>
      {children}
    </CMSContext.Provider>
  );
}

export const useCMS = () => useContext(CMSContext);

export function EditableText({ fieldKey, type = "text", multiline = false, className = "", style = {} }) {
  const { content, updateContent, isAdmin } = useCMS();
  const value = content[fieldKey] || "";

  if (!isAdmin) {
    if (multiline) {
      return <div className={className} style={style}>{value.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}</div>;
    }
    return <span className={className} style={style}>{value}</span>;
  }

  if (multiline) {
    return (
      <textarea 
        className={className}
        style={{ width: '100%', minHeight: '100px', padding: '8px', border: '2px dashed #8FAF8F', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.8)', ...style }}
        value={value}
        onChange={(e) => updateContent(fieldKey, e.target.value)}
      />
    );
  }

  return (
    <input 
      type="text"
      className={className}
      style={{ width: `max(100%, ${value.length + 8}ch)`, padding: '4px', border: '2px dashed #8FAF8F', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.8)', boxSizing: 'border-box', ...style }}
      value={value}
      onChange={(e) => updateContent(fieldKey, e.target.value)}
    />
  );
}

export function EditableImage({ fieldKey, className = "", style = {}, alt = "" }) {
  const { content, updateContent, isAdmin } = useCMS();
  const src = content[fieldKey];

  if (!isAdmin) {
    return <img src={src} alt={alt} className={className} style={style} />;
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const cloudinaryUrl = await uploadImageToCloudinary(file);
      if (cloudinaryUrl) {
        updateContent(fieldKey, cloudinaryUrl);
      }
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%', height: '100%' }}>
      <img src={src} alt={alt} className={className} style={{...style, opacity: 0.7}} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: style.borderRadius || 'inherit', zIndex: 10 }}>
        <label style={{ padding: '8px 16px', background: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}>
          Wijzig Foto
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}
