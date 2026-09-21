import React, { useState, useEffect, useRef } from 'react';
import { useCMS, uploadToCloudinary } from '../cms';
import { LogOut, X, Plus, Trash2, ArrowUp, ArrowDown, MoveUp, MoveDown, Settings, ChevronLeft, Check, Image as ImageIcon, Calendar, RefreshCw, Archive, Video, Folder, Trophy } from 'lucide-react';
import { AdminDossiers } from './AdminDossiers';
import { AdminChallenges } from './AdminChallenges';

const FONTS = [
  'Roboto', 'Open Sans', 'Inter', 'Montserrat', 'Poppins', 'Lato', 
  'Merriweather', 'Playfair Display', 'Oswald', 'Raleway', 
  'Arial', 'Georgia', 'Nunito', 'Quicksand', 
  'Cabin', 'Comfortaa', 'Lora', 'Cormorant Garamond', 'Libre Baskerville',
  'Outfit', 'DM Sans', 'Plus Jakarta Sans', 'Cinzel'
];

export const RichTextEditor = ({ value, onChange, multiline }) => {
  const editorRef = useRef(null);
  
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd, val) => {
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div style={{ border: '1px solid #555', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'transparent' }}>
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', borderBottom: '1px solid #555', backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', position: 'relative' }}>
          <span style={{ fontSize: '0.8rem', color: '#bbb' }}>Kleur:</span>
          <input type="color" onChange={(e) => exec('foreColor', e.target.value)} title="Geselecteerde tekstkleur" style={{ width: '24px', height: '24px', padding: '0', border: 'none', cursor: 'pointer', background: 'transparent' }} />
        </div>
        <select onChange={(e) => { exec('fontSize', e.target.value); e.target.value = ""; }} title="Geselecteerde tekstgrootte" style={{ background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '0.2rem', fontSize: '0.85rem' }}>
          <option value="">Grootte...</option>
          <option value="1">Zeer Klein</option>
          <option value="2">Klein</option>
          <option value="3">Normaal</option>
          <option value="4">Groot</option>
          <option value="5">Groter</option>
          <option value="6">Zeer Groot</option>
          <option value="7">Enorm</option>
        </select>
        <button type="button" onClick={() => exec('bold')} style={{ background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '0.2rem 0.6rem', cursor: 'pointer', fontWeight: 'bold' }}>B</button>
        <button type="button" onClick={() => exec('italic')} style={{ background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '0.2rem 0.6rem', cursor: 'pointer', fontStyle: 'italic' }}>I</button>
      </div>
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
        style={{
          minHeight: multiline ? '300px' : '150px',
          padding: '1.5rem',
          outline: 'none',
          color: '#fff',
          whiteSpace: 'pre-wrap',
          overflowX: 'hidden',
          overflowY: 'auto',
          fontFamily: 'var(--font-body)',
          fontSize: '1.1rem',
          lineHeight: '1.6'
        }}
      />
    </div>
  );
};

const TrashModal = ({ content, restoreSection, permanentlyRemoveSection, close }) => {
  const trashed = content.trashedSections || [];
  
  return (
    <div style={settingsOverlayStyle} onClick={close}>
      <div style={{...settingsPanelStyle, width: '400px', right: '50%', transform: 'translateX(50%)', zIndex: 10001}} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, color: '#fff', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Archive size={20}/> Prullenbak</h3>
          <button onClick={close} style={iconBtnStyle}><X size={20}/></button>
        </div>
        {trashed.length === 0 ? (
          <p style={{color: '#888'}}>De prullenbak is leeg.</p>
        ) : (
          trashed.map(t => {
            const daysLeft = 15 - Math.floor((Date.now() - t.deletedAt) / (1000 * 60 * 60 * 24));
            let name = t.id.toUpperCase();
            if (t.id.startsWith('custom_')) name = (content[`customTitle_${t.id}`] || 'Pagina').toUpperCase();
            if (t.id.startsWith('parallax_')) name = `PARALLAX FOTO (${t.id})`;
            return (
              <div key={t.id} style={{background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #333'}}>
                <div style={{color: '#fff', fontWeight: 'bold', marginBottom: '0.3rem'}}>{name}</div>
                <div style={{color: '#888', fontSize: '0.8rem', marginBottom: '1rem'}}>Nog {daysLeft} dagen bewaard</div>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <button onClick={() => restoreSection(t.id)} style={{...btnStyle, background: 'var(--color-primary)', color: '#fff', flex: 1, padding: '0.5rem', fontSize: '0.9rem'}}><RefreshCw size={14} style={{marginRight: '5px'}}/> Herstellen</button>
                  <button onClick={() => permanentlyRemoveSection(t.id)} style={{...btnStyle, background: '#e74c3c', color: '#fff', flex: 1, padding: '0.5rem', fontSize: '0.9rem'}}><Trash2 size={14} style={{marginRight: '5px'}}/> Definitief weg</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const BookingAgendaModal = ({ content, updateContent, close }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const dateStr = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const slots = content.availableSlots || [];
  const bookedSlots = content.bookedSlots || [];
  
  const slotsForDate = slots.filter(s => s.date === dateStr);
  const bookedForDate = bookedSlots.filter(b => b.date === dateStr);
  
  const toggleSlot = (hour) => {
    const existing = slots.find(s => s.date === dateStr && s.time === hour);
    if (existing) {
      updateContent('availableSlots', slots.filter(s => s.id !== existing.id));
    } else {
      updateContent('availableSlots', [...slots, { id: 'slot_' + Date.now(), date: dateStr, time: hour }]);
    }
  };

  const hours = Array.from({length: 13}, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`); // 08:00 - 20:00
  const nowStr = new Date().toLocaleDateString('en-CA');

  return (
    <div style={settingsOverlayStyle} onClick={close}>
      <div style={{...settingsPanelStyle, width: '500px', right: '50%', transform: 'translateX(50%)', zIndex: 10001}} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, color: '#fff', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Calendar size={20}/> Agenda Beheer</h3>
          <button onClick={close} style={iconBtnStyle}><X size={20}/></button>
        </div>
        
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
          <button onClick={() => setCurrentDate(addDays(currentDate, -1))} disabled={dateStr <= nowStr} style={{...iconBtnStyle, opacity: dateStr <= nowStr ? 0.3 : 1}}><ChevronLeft size={20}/></button>
          <div style={{color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'capitalize'}}>{currentDate.toLocaleDateString('nl-NL', {weekday: 'long', day: 'numeric', month: 'long'})}</div>
          <button onClick={() => setCurrentDate(addDays(currentDate, 1))} style={{...iconBtnStyle, transform: 'rotate(180deg)'}}><ChevronLeft size={20}/></button>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem'}}>
          {hours.map(h => {
            const bookedSlot = bookedForDate.find(b => b.time === h);
            const isBooked = !!bookedSlot;
            const isAvailable = slotsForDate.some(s => s.time === h);
            
            let bg = 'rgba(255,255,255,0.05)';
            let color = '#ccc';
            let border = '1px solid #333';
            let text = h;

            if (isBooked) {
              bg = 'rgba(231, 76, 60, 0.2)';
              border = '1px solid #e74c3c';
              color = '#e74c3c';
              text = `${h} (Volzet)`;
            } else if (isAvailable) {
              bg = 'rgba(46, 204, 113, 0.2)';
              border = '1px solid #2ecc71';
              color = '#2ecc71';
            }

            return (
              <button 
                key={h} 
                disabled={isBooked}
                onClick={() => isBooked ? alert(`Geboekt door:\nNaam: ${bookedSlot.name}\nEmail: ${bookedSlot.email}\nTelefoon: ${bookedSlot.phone}`) : toggleSlot(h)}
                style={{
                  ...btnStyle, 
                  background: bg, 
                  border: border, 
                  color: color, 
                  padding: '1rem 0.5rem', 
                  fontSize: '0.9rem',
                  opacity: isBooked ? 0.7 : 1,
                  cursor: isBooked ? 'help' : 'pointer'
                }}
                title={isBooked ? `Klant gegevens: ${bookedSlot.name || 'Onbekend'} - Klik voor meer info` : ''}
              >
                {text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CALMING_GREENS = [
  { name: 'Zacht Salie', hex: '#8FAF8F' },
  { name: 'Olijf Grijs', hex: '#95A595' },
  { name: 'Licht Pistache', hex: '#C1D5C0' },
  { name: 'Zeemist', hex: '#B2C2B1' },
  { name: 'Zachte Munt', hex: '#A8C3A6' },
  { name: 'Eucalyptus', hex: '#739373' },
  { name: 'Aards Groen', hex: '#9CB39C' },
  { name: 'Matcha', hex: '#B5C9B5' },
  { name: 'Natuurlijk Mos', hex: '#899E89' },
  { name: 'Zacht Varen', hex: '#A3BBA3' }
];

const GlowSettings = ({ sectionId, content, updateContent }) => {
  const enabledKey = `themeEffectEnabled_${sectionId}`;
  const colorKey = `glowColor_${sectionId}`;
  const isEnabled = content[enabledKey] !== false;
  const currentColor = content[colorKey] || content.themeColor || '#8FAF8F';

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(0, 0, 0, 0.2))', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(46, 204, 113, 0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <label style={{color: '#fff', fontWeight: 'bold', fontSize: '1.1rem'}}>✨ Zachte Achtergrond Gloed</label>
        <div style={{position: 'relative', width: '50px', height: '26px', background: isEnabled ? '#2ecc71' : '#555', borderRadius: '13px', cursor: 'pointer', transition: 'all 0.3s'}} onClick={() => updateContent(enabledKey, !isEnabled)}>
          <div style={{position: 'absolute', top: '3px', left: isEnabled ? '27px' : '3px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'all 0.3s'}} />
        </div>
      </div>
      
      {isEnabled && (
        <div style={{marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem'}}>
          <label style={{color: '#ccc', fontSize: '0.9rem', marginBottom: '0.8rem', display: 'block'}}>Kies een rustgevende tint:</label>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
            {CALMING_GREENS.map(g => (
              <button
                key={g.hex}
                onClick={() => updateContent(colorKey, g.hex)}
                style={{
                  width: '35px', height: '35px', borderRadius: '50%', background: g.hex, border: currentColor === g.hex ? '3px solid #fff' : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
                title={g.name}
                type="button"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// FontSettings removed

export function AdminModals() {
  const { 
    content, updateContent, isAdmin, setIsAdmin, 
    showLogin, setShowLogin, moveSection, addCustomSection, 
    addParallaxSection, removeSection, restoreSection, permanentlyRemoveSection 
  } = useCMS();
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [editingPage, setEditingPage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showAgenda, setShowAgenda] = useState(false);
  const [showDossiers, setShowDossiers] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === content.pin) {
      setIsAdmin(true);
      setShowLogin(false);
      setPinInput("");
      setError("");
    } else {
      setError("Onjuiste pincode");
    }
  };

  const order = content.sectionOrder || [];
  
  const basePages = [
    { id: 'hero', title: 'Home (Hero)' },
    { id: 'over', title: 'Over Mij' },
    { id: 'consult', title: 'Mijn Visie' },
    { id: 'aanbod', title: 'Werk Met Mij' },
    { id: 'contact', title: 'Contact' },
    { id: 'footer', title: 'Footer & Privacy' },
  ];

  const customPages = (content.customSections || []).map(s => ({
    id: s.id, title: content[`customTitle_${s.id}`] || 'Nieuwe Pagina', isCustom: true
  }));

  const parallaxPages = order.filter(id => id.startsWith('parallax_') && id !== 'parallax_1' && id !== 'parallax_2').map(id => ({
    id, title: `Parallax Foto (${id})`, isParallax: true
  }));

  const allPages = [...basePages, ...customPages, ...parallaxPages];

  const renderDashboardGrid = () => (
    <div style={gridContainerStyle}>
      {allPages.map(p => {
        const isCustom = p.id.startsWith('custom_') || (p.id.startsWith('parallax_') && p.id !== 'parallax_1' && p.id !== 'parallax_2');
        return (
          <div key={p.id} style={{...pageCardStyle, position: 'relative'}}>
            <div style={{...pageCardOverlayStyle, cursor: 'pointer'}} onClick={() => setEditingPage(p.id)}></div>
            <div style={{...pageCardContentStyle, pointerEvents: 'none'}}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{p.title}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginTop: '0.5rem', textTransform: 'uppercase' }}>Bewerken &rarr;</span>
            </div>
            {isCustom && (
              <button 
                onClick={(e) => { e.stopPropagation(); removeSection(p.id); }} 
                style={{position: 'absolute', top: '10px', right: '10px', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2}}
                title="Verplaats naar prullenbak"
              >
                <Trash2 size={16}/>
              </button>
            )}
          </div>
        );
      })}
      <div style={{...pageCardStyle, border: '1px dashed #555', background: 'transparent'}} onClick={addCustomSection}>
        <div style={{...pageCardContentStyle, justifyContent: 'center', alignItems: 'center'}}>
          <Plus size={32} color="var(--color-primary)" />
          <span style={{marginTop: '1rem', color: '#fff'}}>+ Nieuwe Pagina</span>
        </div>
      </div>
      <div style={{...pageCardStyle, border: '1px dashed #555', background: 'transparent'}} onClick={addParallaxSection}>
        <div style={{...pageCardContentStyle, justifyContent: 'center', alignItems: 'center'}}>
          <ImageIcon size={32} color="var(--color-primary)" />
          <span style={{marginTop: '1rem', color: '#fff'}}>+ Parallax Foto</span>
        </div>
      </div>
    </div>
  );

  const renderEditorFields = (id) => {
    switch (id) {
      case 'hero': return (
        <>
          <VideoUpload label="Hero Achtergrond Video (Optioneel)" field="heroBgVideo" val={content.heroBgVideo} update={updateContent} invertField="invertVideo_hero" invertVal={content.invertVideo_hero} />
          <ImageUpload label="Hero Achtergrond" field="heroImage" val={content.heroImage} update={updateContent} />
          <Field label="Titel" field="heroTitle" val={content.heroTitle} update={updateContent} content={content} fontType="heading" />
          <Field label="Subtitel" field="heroSubtitle" val={content.heroSubtitle} update={updateContent} multiline content={content} fontType="body" />
          <Field label="Knop Tekst" field="heroBtnText" val={content.heroBtnText} update={updateContent} content={content} fontType="body" />
        </>
      );
      case 'over': return (
        <>
          <GlowSettings sectionId="over" content={content} updateContent={updateContent} />
          <VideoUpload label="Achtergrond Video (Fullscreen)" field="customBgVideo_over" val={content.customBgVideo_over} update={updateContent} invertField="invertVideo_over" invertVal={content.invertVideo_over} />
          <ImageUpload label="Over Mij Portret" field="aboutImage" val={content.aboutImage} update={updateContent} />
          <Field label="Titel" field="aboutTitle" val={content.aboutTitle} update={updateContent} content={content} fontType="heading" />
          <Field label="Verhaal Deel 1" field="aboutText1" val={content.aboutText1} update={updateContent} multiline content={content} fontType="body" />
          <Field label="Verhaal Deel 2" field="aboutText2" val={content.aboutText2} update={updateContent} multiline content={content} fontType="body" />
          <Field label="Knop 'Lees meer' Tekst" field="aboutBtnMoreText" val={content.aboutBtnMoreText} update={updateContent} content={content} fontType="body" />
          <Field label="Knop 'Minder tonen' Tekst" field="aboutBtnLessText" val={content.aboutBtnLessText} update={updateContent} content={content} fontType="body" />
          <BlockEditor sectionId="about" content={content} updateContent={updateContent} />
        </>
      );
      case 'consult': return (
        <>
          <GlowSettings sectionId="consult" content={content} updateContent={updateContent} />
          <VideoUpload label="Achtergrond Video (Fullscreen)" field="customBgVideo_consult" val={content.customBgVideo_consult} update={updateContent} invertField="invertVideo_consult" invertVal={content.invertVideo_consult} />
          <ImageUpload label="Consultatie Afbeelding" field="consultationImage" val={content.consultationImage} update={updateContent} />
          <Field label="Titel" field="consultationTitle" val={content.consultationTitle} update={updateContent} content={content} fontType="heading" />
          <Field label="Tekst" field="consultationText" val={content.consultationText} update={updateContent} multiline content={content} fontType="body" />
          <Field label="Knop Tekst" field="consultationBtnText" val={content.consultationBtnText} update={updateContent} content={content} fontType="body" />
          <Field label="Knop 'Visie bekijken' Tekst" field="consultationBtnMoreText" val={content.consultationBtnMoreText} update={updateContent} content={content} fontType="body" />
          <Field label="Knop 'Visie verbergen' Tekst" field="consultationBtnLessText" val={content.consultationBtnLessText} update={updateContent} content={content} fontType="body" />
          <div style={dividerStyle}></div>
          <ImageUpload label="Visie Achtergrond (Parallax)" field="quoteImage" val={content.quoteImage} update={updateContent} />
          <Field label="Visie Tekst (Quote)" field="quoteText" val={content.quoteText} update={updateContent} multiline content={content} fontType="body" />
          <BlockEditor sectionId="consult" content={content} updateContent={updateContent} />
        </>
      );
      case 'aanbod': return (
        <>
          <GlowSettings sectionId="aanbod" content={content} updateContent={updateContent} />
          <VideoUpload label="Achtergrond Video (Fullscreen)" field="customBgVideo_aanbod" val={content.customBgVideo_aanbod} update={updateContent} invertField="invertVideo_aanbod" invertVal={content.invertVideo_aanbod} />
          <Field label="Hoofdtitel Aanbod" field="servicesTitle" val={content.servicesTitle} update={updateContent} content={content} fontType="heading" />
          <Field label="Hoofd Knop Tekst" field="servicesMainBtnText" val={content.servicesMainBtnText} update={updateContent} content={content} fontType="body" />
          <VideoUpload label="Hoofdvideo Aanbod" field="servicesMainVideo" val={content.servicesMainVideo} update={updateContent} />
          <ImageUpload label="Hoofdafbeelding Aanbod (Fallback)" field="servicesMainImage" val={content.servicesMainImage} update={updateContent} />
          <div style={dividerStyle}></div>
          <ImageUpload label="Dienst 1 Foto" field="card1Image" val={content.card1Image} update={updateContent} />
          <Field label="Dienst 1 Titel" field="card1Title" val={content.card1Title} update={updateContent} content={content} fontType="heading" />
          <Field label="Dienst 1 Tekst" field="card1Text" val={content.card1Text} update={updateContent} multiline content={content} fontType="body" />
          <div style={dividerStyle}></div>
          <ImageUpload label="Dienst 2 Foto" field="card2Image" val={content.card2Image} update={updateContent} />
          <Field label="Dienst 2 Titel" field="card2Title" val={content.card2Title} update={updateContent} content={content} fontType="heading" />
          <Field label="Dienst 2 Tekst" field="card2Text" val={content.card2Text} update={updateContent} multiline content={content} fontType="body" />
          <div style={dividerStyle}></div>
          <ImageUpload label="Dienst 3 Foto" field="card3Image" val={content.card3Image} update={updateContent} />
          <Field label="Dienst 3 Titel" field="card3Title" val={content.card3Title} update={updateContent} content={content} fontType="heading" />
          <Field label="Dienst 3 Tekst" field="card3Text" val={content.card3Text} update={updateContent} multiline content={content} fontType="body" />
          <div style={dividerStyle}></div>
          <Field label="Extra Tekst onder de 3 stappen (Binnen stappenplan)" field="servicesStepsBottomText" val={content.servicesStepsBottomText} update={updateContent} multiline content={content} fontType="body" />
          <Field label="Knop 'Interesse' (onderaan) Tekst" field="servicesInterestBtnText" val={content.servicesInterestBtnText} update={updateContent} content={content} fontType="body" />
          <Field label="Knop 'Minder info' (onderaan) Tekst" field="servicesLessBtnText" val={content.servicesLessBtnText} update={updateContent} content={content} fontType="body" />
          <BlockEditor sectionId="aanbod" content={content} updateContent={updateContent} />
        </>
      );
      case 'contact': return (
        <>
          <GlowSettings sectionId="contact" content={content} updateContent={updateContent} />
          <VideoUpload label="Achtergrond Video (Fullscreen)" field="customBgVideo_contact" val={content.customBgVideo_contact} update={updateContent} invertField="invertVideo_contact" invertVal={content.invertVideo_contact} />
          <ImageUpload label="Contact Achtergrond" field="contactImage" val={content.contactImage} update={updateContent} />
          <Field label="Titel" field="contactTitle" val={content.contactTitle} update={updateContent} content={content} fontType="heading" />
          <Field label="Subtitel" field="contactSubtitle" val={content.contactSubtitle} update={updateContent} multiline content={content} fontType="body" />
          <Field label="Verzendknop Tekst" field="contactSubmitBtnText" val={content.contactSubmitBtnText} update={updateContent} content={content} fontType="body" />
          <AvailabilityEditor content={content} updateContent={updateContent} />
          <QuestionsEditor content={content} updateContent={updateContent} />
          <Field label="Web3Forms Access Key" field="web3formsKey" val={content.web3formsKey} update={updateContent} type="plain" />
          <BlockEditor sectionId="contact" content={content} updateContent={updateContent} />
        </>
      );
      case 'footer': return (
        <>
          <VideoUpload label="Logo Video (Header & Footer)" field="logoVideo" val={content.logoVideo} update={updateContent} />
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px'}}>
            <label style={{color: '#ccc', flex: 1, fontWeight: 'bold'}}>Grootte Logo (Header)</label>
            <input type="range" min="0.5" max="4.0" step="0.1" value={content.logoScaleHeader ?? content.logoScale ?? 1.0} onChange={(e) => updateContent('logoScaleHeader', parseFloat(e.target.value))} style={{flex: 2}} />
            <span style={{color: 'var(--color-primary)', minWidth: '40px'}}>{content.logoScaleHeader ?? content.logoScale ?? 1.0}x</span>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px'}}>
            <label style={{color: '#ccc', flex: 1, fontWeight: 'bold'}}>Verschuiving Logo L/R (Header)</label>
            <input type="range" min="-150" max="150" step="1" value={content.logoOffsetXHeader || 0} onChange={(e) => updateContent('logoOffsetXHeader', parseInt(e.target.value))} style={{flex: 2}} />
            <span style={{color: 'var(--color-primary)', minWidth: '40px'}}>{content.logoOffsetXHeader || 0}px</span>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px'}}>
            <label style={{color: '#ccc', flex: 1, fontWeight: 'bold'}}>Grootte Logo (Footer)</label>
            <input type="range" min="0.5" max="4.0" step="0.1" value={content.logoScaleFooter ?? content.logoScale ?? 1.0} onChange={(e) => updateContent('logoScaleFooter', parseFloat(e.target.value))} style={{flex: 2}} />
            <span style={{color: 'var(--color-primary)', minWidth: '40px'}}>{content.logoScaleFooter ?? content.logoScale ?? 1.0}x</span>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px'}}>
            <label style={{color: '#ccc', flex: 1, fontWeight: 'bold'}}>Verschuiving Logo L/R (Footer)</label>
            <input type="range" min="-150" max="150" step="1" value={content.logoOffsetXFooter || 0} onChange={(e) => updateContent('logoOffsetXFooter', parseInt(e.target.value))} style={{flex: 2}} />
            <span style={{color: 'var(--color-primary)', minWidth: '40px'}}>{content.logoOffsetXFooter || 0}px</span>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px'}}>
            <label style={{color: '#ccc', flex: 1, fontWeight: 'bold'}}>Snij zwarte boven/onderranden weg (en blur overgangen)</label>
            <input type="checkbox" checked={content.logoCrop || false} onChange={(e) => updateContent('logoCrop', e.target.checked)} style={{width: '24px', height: '24px', accentColor: 'var(--color-primary)'}} />
          </div>
          <Field label="Logo Tekst" field="footerLogo" val={content.footerLogo} update={updateContent} content={content} fontType="heading" />
          <Field label="Copyright Tekst" field="footerCopyright" val={content.footerCopyright} update={updateContent} content={content} fontType="body" />
          <Field label="Navigatie Knop Tekst" field="navBtnText" val={content.navBtnText} update={updateContent} content={content} fontType="body" />
          <Field label="Privacy Disclaimer" field="privacyDisclaimer" val={content.privacyDisclaimer} update={updateContent} multiline content={content} fontType="body" />
        </>
      );
      default:
        if (id.startsWith('parallax_')) {
          return <ImageUpload label="Parallax Afbeelding" field={`${id}Image`} val={content[`${id}Image`]} update={updateContent} />;
        }
        return (
          <>
            <GlowSettings sectionId={id} content={content} updateContent={updateContent} />
            <VideoUpload label="Achtergrond Video (Fullscreen)" field={`customBgVideo_${id}`} val={content[`customBgVideo_${id}`]} update={updateContent} invertField={`invertVideo_${id}`} invertVal={content[`invertVideo_${id}`]} />
            <Field label="Paginatitel" field={`customTitle_${id}`} val={content[`customTitle_${id}`]} update={updateContent} content={content} fontType="heading" />
            <ImageUpload label="Optionele Afbeelding in Sectie" field={`customImage_${id}`} val={content[`customImage_${id}`]} update={updateContent} />
            <Field label="Tekst" field={`customText_${id}`} val={content[`customText_${id}`]} update={updateContent} multiline content={content} fontType="body" />
            <BlockEditor sectionId={id} content={content} updateContent={updateContent} />
          </>
        );
    }
  };

  const renderLivePreview = (id) => {
    return (
      <div style={previewContainerStyle}>
        <div style={{ ...previewBoxStyle, fontFamily: content.themeHeadingFont }}>
          <LivePreviewRenderer id={id} content={content} />
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div style={settingsPanelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ margin: 0, color: '#fff' }}>Instellingen</h3>
        <button onClick={() => setShowSettings(false)} style={iconBtnStyle}><X size={20}/></button>
      </div>

      <div style={settingsSectionStyle}>
        <h4 style={settingsTitleStyle}>Design</h4>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1rem'}}>
          <label style={{color: '#bbb', flex: 1}}>Thema Kleur</label>
          <input type="color" value={content.themeColor || "#8FAF8F"} onChange={(e) => updateContent('themeColor', e.target.value)} style={colorPickerStyle} />
        </div>
        <Field label="Koppen Lettertype" field="themeHeadingFont" val={content.themeHeadingFont || "Playfair Display"} update={updateContent} type="select" options={FONTS} />
        <div style={{marginTop: '1rem'}}></div>
        <Field label="Tekst Lettertype" field="themeBodyFont" val={content.themeBodyFont || "Inter"} update={updateContent} type="select" options={FONTS} />
        <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginTop: '1rem'}}>
          <label style={{color: '#bbb', flex: 1}}>Scroll Animaties</label>
          <input type="checkbox" checked={content.animationsEnabled !== false} onChange={(e) => updateContent('animationsEnabled', e.target.checked)} style={{width: '24px', height: '24px', accentColor: 'var(--color-primary)'}} />
        </div>
      </div>

      <div style={settingsSectionStyle}>
        <h4 style={settingsTitleStyle}>SEO / GEO / AI & Google Zoekresultaten</h4>
        <Field label="Website Titel (Google & AI Overviews)" field="seoTitle" val={content.seoTitle} update={updateContent} type="plain" />
        <Field label="Website Omschrijving (Google Snippet)" field="seoDescription" val={content.seoDescription} update={updateContent} type="plain" multiline={true} />
        <p style={{color: '#888', fontSize: '0.8rem', marginTop: '-10px', fontStyle: 'italic', marginBottom: '1.2rem'}}>
          Tip: Hou de omschrijving tussen de 120 en 160 tekens voor de beste weergave.
        </p>
        <Field label="Werkregio / Locatie (Lokale SEO / GEO)" field="seoRegion" val={content.seoRegion} update={updateContent} type="plain" />
        <Field label="Belangrijkste Thema's / Zoekwoorden (voor AI engines, gescheiden door komma's)" field="seoKeywords" val={content.seoKeywords} update={updateContent} type="plain" multiline={true} />
      </div>

      <div style={settingsSectionStyle}>
        <h4 style={settingsTitleStyle}>Socials</h4>
        <Field label="Instagram" field="instagramLink" val={content.instagramLink} update={updateContent} type="plain" />
        <Field label="Facebook" field="facebookLink" val={content.facebookLink} update={updateContent} type="plain" />
        <Field label="LinkedIn" field="linkedinLink" val={content.linkedinLink} update={updateContent} type="plain" />
      </div>

      <div style={settingsSectionStyle}>
        <h4 style={settingsTitleStyle}>Sectie Volgorde</h4>
        {order.map((oid, index) => {
          let name = oid.toUpperCase();
          if (oid.startsWith('custom_')) name = (content[`customTitle_${oid}`] || 'Pagina').toUpperCase();
          if (oid.startsWith('parallax_')) name = `PARALLAX FOTO (${oid})`;
          if (oid === 'visie') name = 'VISIE (PARALLAX)';
          const isCustom = oid.startsWith('custom_') || (oid.startsWith('parallax_') && oid !== 'parallax_1' && oid !== 'parallax_2');
          return (
            <div key={oid} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid #333'}}>
              <span style={{fontWeight: 'bold', color: '#fff', fontSize: '0.8rem'}}>{name}</span>
              <div style={{display: 'flex', gap: '0.2rem'}}>
                <button onClick={() => moveSection(index, -1)} disabled={index === 0} style={{...iconBtnStyle, width: '28px', height: '28px'}}><ArrowUp size={14}/></button>
                <button onClick={() => moveSection(index, 1)} disabled={index === order.length - 1} style={{...iconBtnStyle, width: '28px', height: '28px'}}><ArrowDown size={14}/></button>
                {isCustom && <button onClick={() => removeSection(oid)} style={{...iconBtnStyle, width: '28px', height: '28px', color: '#e74c3c'}}><Trash2 size={14}/></button>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={settingsSectionStyle}>
        <h4 style={settingsTitleStyle}>Beveiliging</h4>
        <Field label="Nieuwe Pincode" field="pin" val={content.pin} update={updateContent} type="plain" />
      </div>
    </div>
  );

  return (
    <>
      {showLogin && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => setShowLogin(false)} style={closeBtnStyle}><X size={20}/></button>
            <h3 style={{marginBottom: '1rem', color: '#fff'}}>Beheerder Login</h3>
            <form onSubmit={handleLogin}>
              <input type="password" placeholder="Voer pincode in" value={pinInput} onChange={(e) => setPinInput(e.target.value)} style={loginInputStyle} autoFocus />
              {error && <p style={{color: '#e74c3c', fontSize: '0.9rem', marginTop: '0.5rem'}}>{error}</p>}
              <button type="submit" style={{...btnStyle, marginTop: '1rem', width: '100%'}}>Inloggen</button>
            </form>
          </div>
        </div>
      )}

      {isAdmin && (
        <div style={sidebarDashboardStyle}>
          {/* Header */}
          <div style={dashboardHeaderStyle}>
            <h2 style={{margin: 0, fontSize: '1.2rem', letterSpacing: '1px', fontWeight: '400', textTransform: 'uppercase'}}>
              {editingPage ? (
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <button onClick={() => setEditingPage(null)} style={{...iconBtnStyle, width: '32px', height: '32px'}}><ChevronLeft size={20}/></button>
                  {allPages.find(p => p.id === editingPage)?.title || 'Bewerken'}
                </div>
              ) : 'Beheer'}
            </h2>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <button onClick={() => setShowChallenges(true)} style={{...iconBtnStyle, width: '32px', height: '32px', color: '#f59e0b'}} title="Challenge & Quiz Beheer"><Trophy size={18}/></button>
              <button onClick={() => setShowDossiers(true)} style={{...iconBtnStyle, width: '32px', height: '32px', color: '#f39c12'}} title="Dossierbeheer"><Folder size={18}/></button>
              <button onClick={() => setShowAgenda(true)} style={{...iconBtnStyle, width: '32px', height: '32px', color: '#2ecc71'}} title="Agenda & Boekingen"><Calendar size={18}/></button>
              {content.trashedSections && content.trashedSections.length > 0 && (
                <button onClick={() => setShowTrash(true)} style={{...iconBtnStyle, width: '32px', height: '32px', color: '#e74c3c'}} title="Prullenbak"><Archive size={18}/></button>
              )}
              <button onClick={() => setShowSettings(true)} style={{...iconBtnStyle, width: '32px', height: '32px'}} title="Instellingen"><Settings size={18}/></button>
              <button onClick={() => setIsAdmin(false)} style={{background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold'}} title="Uitloggen"><LogOut size={14}/></button>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={dashboardBodyStyle}>
            {editingPage ? (
              <div style={editorSplitStyle}>
                <div style={editorLeftPanelStyle}>
                  <div style={fieldsContainerStyle}>
                    {renderEditorFields(editingPage)}
                  </div>
                </div>
              </div>
            ) : (
              <div style={dashboardGridWrapperStyle}>
                <h3 style={{color: '#fff', fontWeight: 300, marginBottom: '1.5rem', fontSize: '1.1rem'}}>Selecteer een pagina om te bewerken</h3>
                {renderDashboardGrid()}
              </div>
            )}
          </div>

          {/* Settings Slide-out Panel */}
          {showSettings && (
            <>
              <div style={settingsOverlayStyle} onClick={() => setShowSettings(false)}></div>
              {renderSettings()}
            </>
          )}

          {showTrash && (
            <TrashModal content={content} restoreSection={restoreSection} permanentlyRemoveSection={permanentlyRemoveSection} close={() => setShowTrash(false)} />
          )}

          {showAgenda && (
            <BookingAgendaModal content={content} updateContent={updateContent} close={() => setShowAgenda(false)} />
          )}

          {showDossiers && (
            <AdminDossiers close={() => setShowDossiers(false)} />
          )}

          {showChallenges && (
            <AdminChallenges close={() => setShowChallenges(false)} content={content} updateContent={updateContent} />
          )}
        </div>
      )}
    </>
  );
}



const Field = ({ label, field, val, update, multiline, options, type="text", fontType, content }) => {
  return (
  <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <label style={{color: '#bbb', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>{label}</label>
      {fontType && content && (
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <span style={{color: '#888', fontSize: '0.8rem'}}>{fontType === 'heading' ? 'Koppen Lettertype:' : 'Tekst Lettertype:'}</span>
          <select value={content[`${field}Font`] || ''} onChange={e => update(`${field}Font`, e.target.value)} style={{background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '0.2rem', fontSize: '0.8rem'}}>
            <option value="">Standaard</option>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      )}
    </div>
    {type === 'select' ? (
      <select value={val || ''} onChange={e => update(field, e.target.value)} style={inputStyle}>
        {options && options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : type === 'plain' ? (
      multiline ? (
        <textarea value={val || ''} onChange={e => update(field, e.target.value)} style={{...inputStyle, minHeight: '150px'}} />
      ) : (
        <input type="text" value={val || ''} onChange={e => update(field, e.target.value)} style={inputStyle} />
      )
    ) : (
      <RichTextEditor value={val} onChange={newVal => update(field, newVal)} multiline={multiline} />
    )}
  </div>
  );
};

const ImageUpload = ({ label, field, val, update }) => {
  const [loading, setLoading] = useState(false);
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const url = await uploadToCloudinary(file);
      if (url) update(field, url);
      setLoading(false);
    }
  };
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333'}}>
      <label style={{color: '#bbb', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>{label}</label>
      <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
        {val ? <img src={val} alt="preview" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #555'}} /> : <div style={{width: '100px', height: '100px', borderRadius: '8px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666'}}><ImageIcon size={32}/></div>}
        <div style={{flex: 1, display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <label style={{...btnStyle, display: 'inline-block', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1}}>
            {loading ? 'Uploaden...' : (val ? 'Vervangen' : 'Afbeelding Kiezen')}
            <input type="file" accept="image/*" onChange={handleUpload} style={{display: 'none'}} disabled={loading} />
          </label>
          {val && (
            <button 
              onClick={() => update(field, "")} 
              style={{...btnStyle, background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', color: '#e74c3c', padding: '0.6rem 1rem'}}
              title="Afbeelding verwijderen"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const VideoUpload = ({ label, field, val, update, invertField, invertVal }) => {
  const [loading, setLoading] = useState(false);
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const url = await uploadToCloudinary(file, 'video');
      if (url) update(field, url);
      setLoading(false);
    }
  };
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333'}}>
      <label style={{color: '#bbb', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>{label}</label>
      <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
        {val ? <video src={val} muted loop style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #555'}} /> : <div style={{width: '100px', height: '100px', borderRadius: '8px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666'}}>VIDEO</div>}
        <div style={{flex: 1, display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <label style={{...btnStyle, display: 'inline-block', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1}}>
            {loading ? 'Uploaden...' : (val ? 'Vervangen' : 'Video Kiezen')}
            <input type="file" accept="video/*" onChange={handleUpload} style={{display: 'none'}} disabled={loading} />
          </label>
          {val && (
            <button 
              onClick={() => update(field, "")} 
              style={{...btnStyle, background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', color: '#e74c3c', padding: '0.6rem 1rem'}}
              title="Video verwijderen"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      {invertField && val && (
        <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#bbb', cursor: 'pointer', fontSize: '0.9rem'}}>
          <input type="checkbox" checked={invertVal || false} onChange={(e) => update(invertField, e.target.checked)} style={{accentColor: 'var(--color-primary)', width: '18px', height: '18px'}} />
          Kleur omkeren (Gebruik bij witte website + video met zwarte achtergrond)
        </label>
      )}
    </div>
  );
}
const AvailabilityEditor = ({ content, updateContent }) => {
  const slots = content.availableSlots || [];

  const addSlot = () => {
    const newSlot = { id: 'slot_' + Date.now(), date: '', time: '' };
    updateContent('availableSlots', [...slots, newSlot]);
  };

  const updateSlot = (id, updates) => {
    updateContent('availableSlots', slots.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSlot = (id) => {
    updateContent('availableSlots', slots.filter(s => s.id !== id));
  };

  const sortedSlots = [...slots].sort((a, b) => {
    if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
    return (a.time || '').localeCompare(b.time || '');
  });

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid #333'}}>
      <label style={{color: 'var(--color-primary)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>Beschikbaarheid (Boekingen)</label>
      
      {sortedSlots.map((s) => (
        <div key={s.id} style={{display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid #444'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1}}>
            <label style={{color: '#bbb', fontSize: '0.8rem'}}>Datum</label>
            <input type="date" value={s.date || ''} onChange={e => updateSlot(s.id, {date: e.target.value})} style={{...inputStyle, padding: '0.6rem', minHeight: 'auto'}} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1}}>
            <label style={{color: '#bbb', fontSize: '0.8rem'}}>Tijd</label>
            <input type="time" value={s.time || ''} onChange={e => updateSlot(s.id, {time: e.target.value})} style={{...inputStyle, padding: '0.6rem', minHeight: 'auto'}} />
          </div>
          <button onClick={() => removeSlot(s.id)} style={{...iconBtnStyle, width: '40px', height: '40px', color: '#e74c3c', marginTop: '1.8rem'}} title="Verwijder tijdslot"><Trash2 size={18}/></button>
        </div>
      ))}
      
      <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem'}}>
        <button onClick={addSlot} style={{...btnStyle, background: '#333', color: '#fff', fontSize: '0.9rem'}}>+ Tijdslot Toevoegen</button>
      </div>
    </div>
  );
};

const QuestionsEditor = ({ content, updateContent }) => {
  const questions = content.contactQuestions || [];
  
  const addQuestion = (type) => {
    const newQ = { id: 'q_' + Date.now(), type, question: 'Nieuwe vraag...' };
    if (type !== 'text') newQ.options = 'Optie 1, Optie 2';
    updateContent('contactQuestions', [...questions, newQ]);
  };
  
  const updateQuestion = (id, updates) => {
    updateContent('contactQuestions', questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };
  
  const removeQuestion = (id) => {
    updateContent('contactQuestions', questions.filter(q => q.id !== id));
  };
  
  const moveQuestion = (index, dir) => {
    const newQ = [...questions];
    const target = index + dir;
    if (target < 0 || target >= newQ.length) return;
    [newQ[index], newQ[target]] = [newQ[target], newQ[index]];
    updateContent('contactQuestions', newQ);
  };
  
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid #333'}}>
      <label style={{color: 'var(--color-primary)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>Contact Vragen</label>
      
      {questions.map((q, i) => (
        <div key={q.id} style={{background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #444'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem'}}>
            <span style={{color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9rem'}}>{q.type === 'text' ? 'Open Vraag' : 'Meerkeuze Vraag'}</span>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button onClick={() => moveQuestion(i, -1)} disabled={i===0} style={{...iconBtnStyle, width: '30px', height: '30px'}}><MoveUp size={16}/></button>
              <button onClick={() => moveQuestion(i, 1)} disabled={i===questions.length-1} style={{...iconBtnStyle, width: '30px', height: '30px'}}><MoveDown size={16}/></button>
              <button onClick={() => removeQuestion(q.id)} style={{...iconBtnStyle, width: '30px', height: '30px', color: '#e74c3c'}}><Trash2 size={16}/></button>
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <input type="text" placeholder="Typ hier de vraag..." value={q.question || ''} onChange={e => updateQuestion(q.id, {question: e.target.value})} style={inputStyle} />
            {q.type !== 'text' && (
              <>
                <label style={{color: '#bbb', fontSize: '0.85rem'}}>Opties (gescheiden door een komma):</label>
                <input type="text" placeholder="Bijv: Optie 1, Optie 2, Optie 3" value={q.options || ''} onChange={e => updateQuestion(q.id, {options: e.target.value})} style={inputStyle} />
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <label style={{color: '#bbb', fontSize: '0.85rem'}}>Type meerkeuze:</label>
                  <select value={q.type} onChange={e => updateQuestion(q.id, {type: e.target.value})} style={{...inputStyle, padding: '0.5rem', width: 'auto', minHeight: 'auto'}}>
                    <option value="checkbox">Meerdere antwoorden (Checkboxes)</option>
                    <option value="radio">Eén antwoord (Radio buttons)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
      
      <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem'}}>
        <button onClick={() => addQuestion('text')} style={{...btnStyle, background: '#333', color: '#fff', fontSize: '0.9rem'}}>+ Open Vraag</button>
        <button onClick={() => addQuestion('checkbox')} style={{...btnStyle, background: '#333', color: '#fff', fontSize: '0.9rem'}}>+ Meerkeuze Vraag</button>
        <button onClick={() => addQuestion('booking')} style={{...btnStyle, background: '#333', color: '#fff', fontSize: '0.9rem'}}>+ Boekingskalender</button>
      </div>
    </div>
  );
};

const BlockEditor = ({ sectionId, content, updateContent }) => {
  const blocksKey = `customBlocks_${sectionId}`;
  const blocks = content[blocksKey] || [];

  const addBlock = (type) => {
    let newBlock = { id: 'b_' + Date.now(), type };
    if (type === 'text') newBlock.text = 'Nieuwe tekst...';
    if (type === 'image') newBlock.url = '';
    if (type === 'accordion') { newBlock.title = 'Titel'; newBlock.content = 'Inhoud...'; }
    if (type === 'button') { newBlock.label = 'Knop tekst'; newBlock.link = '#contact'; newBlock.actionType = 'link'; newBlock.expandText = ''; }
    updateContent(blocksKey, [...blocks, newBlock]);
  };

  const updateBlock = (blockId, updates) => {
    updateContent(blocksKey, blocks.map(b => b.id === blockId ? { ...b, ...updates } : b));
  };

  const moveBlock = (index, dir) => {
    const newBlocks = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    updateContent(blocksKey, newBlocks);
  };

  const removeBlock = (blockId) => {
    updateContent(blocksKey, blocks.filter(b => b.id !== blockId));
  };

  const BlockImageUpload = ({ val, onUpload }) => {
    const [loading, setLoading] = useState(false);
    return (
      <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem'}}>
        {val && <img src={val} alt="preview" style={{height: '80px', borderRadius: '4px', border: '1px solid #555'}} />}
        <label style={{...btnStyle, padding: '0.6rem 1rem', fontSize: '0.9rem', cursor: loading ? 'wait' : 'pointer'}}>
          {loading ? 'Uploaden...' : 'Upload Foto'}
          <input type="file" accept="image/*" onChange={async e => {
            if(e.target.files[0]) {
              setLoading(true);
              const url = await uploadToCloudinary(e.target.files[0]);
              if(url) onUpload(url);
              setLoading(false);
            }
          }} style={{display: 'none'}} disabled={loading} />
        </label>
      </div>
    );
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid #333'}}>
      <label style={{color: 'var(--color-primary)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>Extra Blokken (Page Builder)</label>
      
      {blocks.length === 0 && <p style={{color: '#666', fontSize: '1rem'}}>Nog geen blokken toegevoegd. Klik hieronder om extra inhoud toe te voegen.</p>}
      
      {blocks.map((b, i) => (
        <div key={b.id} style={{background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #444'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem'}}>
            <span style={{color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9rem'}}>{b.type} BLOK</span>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button onClick={() => moveBlock(i, -1)} disabled={i===0} style={{...iconBtnStyle, width: '30px', height: '30px'}}><MoveUp size={16}/></button>
              <button onClick={() => moveBlock(i, 1)} disabled={i===blocks.length-1} style={{...iconBtnStyle, width: '30px', height: '30px'}}><MoveDown size={16}/></button>
              <button onClick={() => removeBlock(b.id)} style={{...iconBtnStyle, width: '30px', height: '30px', color: '#e74c3c'}}><Trash2 size={16}/></button>
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <label style={{color: '#bbb', fontSize: '0.85rem'}}>Breedte:</label>
              <select value={b.width || '100%'} onChange={e => updateBlock(b.id, {width: e.target.value})} style={{...inputStyle, padding: '0.5rem', width: 'auto', minHeight: 'auto', fontSize: '0.9rem'}}>
                <option value="25%">25%</option>
                <option value="33%">33%</option>
                <option value="50%">50%</option>
                <option value="75%">75%</option>
                <option value="100%">100%</option>
              </select>
            </div>
            {b.type === 'text' && (
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <label style={{color: '#bbb', fontSize: '0.85rem'}}>Achtergrond:</label>
                <input type="color" value={b.bgColor || '#000000'} onChange={e => updateBlock(b.id, {bgColor: e.target.value})} style={colorPickerStyle} />
                {b.bgColor && <button onClick={() => updateBlock(b.id, {bgColor: ''})} style={{background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.8rem'}}>✕ Wis</button>}
              </div>
            )}
          </div>

          {b.type === 'text' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <label style={{color: '#bbb', fontSize: '0.9rem'}}>Tekst Kleur:</label>
                  <input type="color" value={b.color || '#ffffff'} onChange={e => updateBlock(b.id, {color: e.target.value})} style={colorPickerStyle} />
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <label style={{color: '#bbb', fontSize: '0.9rem'}}>Uitlijning:</label>
                  <select value={b.align || 'left'} onChange={e => updateBlock(b.id, {align: e.target.value})} style={{...inputStyle, padding: '0.6rem', width: 'auto', minHeight: 'auto'}}>
                    <option value="left">Links</option>
                    <option value="center">Midden</option>
                    <option value="right">Rechts</option>
                  </select>
                </div>
              </div>
              <textarea value={b.text || ''} onChange={e => updateBlock(b.id, {text: e.target.value})} style={{...inputStyle, minHeight: '200px', resize: 'vertical'}} />
            </div>
          )}
          {b.type === 'image' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <BlockImageUpload val={b.url} onUpload={url => updateBlock(b.id, {url})} />
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <label style={{color: '#bbb', fontSize: '0.9rem'}}>Uitlijning Foto:</label>
                <select value={b.align || 'center'} onChange={e => updateBlock(b.id, {align: e.target.value})} style={{...inputStyle, padding: '0.6rem', width: 'auto', minHeight: 'auto'}}>
                  <option value="left">Links</option>
                  <option value="center">Midden</option>
                  <option value="right">Rechts</option>
                </select>
              </div>
            </div>
          )}
          {b.type === 'accordion' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <input type="text" placeholder="Titel (bijv. Meer info)" value={b.title || ''} onChange={e => updateBlock(b.id, {title: e.target.value})} style={inputStyle} />
              <textarea placeholder="Uitklapbare tekst..." value={b.content || ''} onChange={e => updateBlock(b.id, {content: e.target.value})} style={{...inputStyle, minHeight: '120px'}} />
            </div>
          )}
          {b.type === 'button' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <input type="text" placeholder="Knop tekst (bijv. Wanneer is coaching niet geschikt)" value={b.label || ''} onChange={e => updateBlock(b.id, {label: e.target.value})} style={inputStyle} />
              
              <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <label style={{color: '#bbb', fontSize: '0.9rem'}}>Knop Actie:</label>
                <select 
                  value={b.actionType || (b.expandText ? 'expand' : 'link')} 
                  onChange={e => updateBlock(b.id, {actionType: e.target.value})} 
                  style={{...inputStyle, padding: '0.6rem', width: 'auto', minHeight: 'auto'}}
                >
                  <option value="link">Link openen (bijv. naar contact)</option>
                  <option value="expand">Tekst uitklappen bij klikken</option>
                  <option value="signup">Inschrijven / Aanmelden formulier</option>
                  <option value="quiz">Challenge / Quiz starten (Quiz Maker)</option>
                  <option value="html">HTML Code tonen (zoals Web3Forms)</option>
                </select>
              </div>

              {b.actionType === 'expand' || (!b.actionType && b.expandText) ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  <label style={{color: '#aaa', fontSize: '0.85rem'}}>Tekst die verschijnt als men op de knop klikt:</label>
                  <textarea 
                    placeholder="Typ hier de tekst die tevoorschijn komt..." 
                    value={b.expandText || ''} 
                    onChange={e => updateBlock(b.id, {expandText: e.target.value})} 
                    style={{...inputStyle, minHeight: '120px', resize: 'vertical'}} 
                  />
                </div>
              ) : b.actionType === 'signup' ? (
                <div style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '1rem', color: '#34d399', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  <div style={{fontWeight: 'bold'}}>📝 Inschrijfformulier (Naam, E-mail, Telefoon)</div>
                  <div style={{color: '#e2e8f0', fontSize: '0.85rem'}}>
                    Bezoekers kunnen zich via deze knop direct aanmelden (naam, e-mail en optioneel telefoon). Alle inschrijvingen verschijnen overzichtelijk in het beheerpaneel!
                  </div>
                </div>
              ) : b.actionType === 'html' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  <label style={{color: '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold'}}>Web3Forms of HTML Code (opent in pop-up):</label>
                  <textarea 
                    placeholder="Plak hier je <form action='https://api.web3forms.com/submit' ...> of embed code..." 
                    value={b.htmlCode || ''} 
                    onChange={e => updateBlock(b.id, {htmlCode: e.target.value})} 
                    style={{...inputStyle, minHeight: '140px', fontFamily: 'monospace', color: '#38bdf8', resize: 'vertical'}} 
                  />
                </div>
              ) : b.actionType === 'quiz' ? (
                <div style={{background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '1rem', color: '#fbbf24', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  <div style={{fontWeight: 'bold'}}>🏆 Gekoppeld aan de Challenge & Quiz Maker</div>
                  <div style={{color: '#e2e8f0', fontSize: '0.85rem'}}>
                    Als een bezoeker op deze knop klikt, opent direct de interactieve challenge quiz. Deelnemers worden automatisch geregistreerd in het beheerpaneel!
                  </div>
                </div>
              ) : (
                <input type="text" placeholder="Link (bijv. #contact of https://...)" value={b.link || ''} onChange={e => updateBlock(b.id, {link: e.target.value})} style={inputStyle} />
              )}

              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <label style={{color: '#bbb', fontSize: '0.9rem'}}>Uitlijning Knop:</label>
                <select value={b.align || 'center'} onChange={e => updateBlock(b.id, {align: e.target.value})} style={{...inputStyle, padding: '0.6rem', width: 'auto', minHeight: 'auto'}}>
                  <option value="left">Links</option>
                  <option value="center">Midden</option>
                  <option value="right">Rechts</option>
                </select>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem'}}>
        <button onClick={() => addBlock('text')} style={{...btnStyle, background: '#333', color: '#fff', fontSize: '0.9rem'}}>+ Tekst</button>
        <button onClick={() => addBlock('image')} style={{...btnStyle, background: '#333', color: '#fff', fontSize: '0.9rem'}}>+ Foto</button>
        <button onClick={() => addBlock('accordion')} style={{...btnStyle, background: '#333', color: '#fff', fontSize: '0.9rem'}}>+ Accordeon</button>
        <button onClick={() => addBlock('button')} style={{...btnStyle, background: '#333', color: '#fff', fontSize: '0.9rem'}}>+ Knop</button>
      </div>
    </div>
  );
}

// --- Styles ---

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(5px)'
};
const modalContentStyle = {
  backgroundColor: '#1a1a1a', padding: '2.5rem', borderRadius: '16px', width: '90%', maxWidth: '400px',
  position: 'relative', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};
const closeBtnStyle = { position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#999', cursor: 'pointer' };

const sidebarDashboardStyle = {
  position: 'fixed', top: 0, left: 0, width: '450px', bottom: 0,
  backgroundColor: '#111', zIndex: 9999,
  display: 'flex', flexDirection: 'column',
  fontFamily: 'Inter, sans-serif',
  boxShadow: '4px 0 25px rgba(0,0,0,0.5)',
  borderRight: '1px solid #333'
};

const dashboardHeaderStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '1.2rem 1.5rem', borderBottom: '1px solid #222', backgroundColor: 'rgba(20,20,20,0.95)',
  backdropFilter: 'blur(10px)'
};

const dashboardBodyStyle = {
  flex: 1, overflow: 'hidden', position: 'relative'
};

const dashboardGridWrapperStyle = {
  padding: '1.5rem', overflowY: 'auto', height: '100%', boxSizing: 'border-box'
};

const gridContainerStyle = {
  display: 'grid', gridTemplateColumns: '1fr', gap: '1rem'
};

const pageCardStyle = {
  background: '#1e1e1e', borderRadius: '12px', height: '80px', position: 'relative',
  cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s ease',
  border: '1px solid #333', display: 'flex', flexDirection: 'column'
};

const pageCardOverlayStyle = {
  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.3)',
  zIndex: 1, transition: 'background 0.2s ease'
};

const pageCardContentStyle = {
  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '1rem 1.5rem',
  zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff'
};

const editorSplitStyle = {
  display: 'flex', width: '100%', height: '100%'
};

const editorLeftPanelStyle = {
  width: '100%', height: '100%', background: '#161616',
  display: 'flex', flexDirection: 'column'
};

const fieldsContainerStyle = {
  padding: '1.5rem', overflowY: 'auto', flex: 1
};

const settingsOverlayStyle = {
  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10
};

const settingsPanelStyle = {
  position: 'absolute', top: 0, right: 0, bottom: 0, width: '450px',
  backgroundColor: '#1a1a1a', borderLeft: '1px solid #333', zIndex: 11,
  padding: '2.5rem', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
};

const settingsSectionStyle = {
  marginBottom: '3rem', borderBottom: '1px solid #333', paddingBottom: '2rem'
};

const settingsTitleStyle = {
  color: 'var(--color-primary)', fontSize: '1.1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px'
};

const inputStyle = {
  width: '100%', padding: '1.2rem', borderRadius: '8px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid #555',
  color: '#fff', fontSize: '1.1rem', fontFamily: 'inherit',
  boxSizing: 'border-box', minHeight: '60px', transition: 'border-color 0.2s'
};

const loginInputStyle = {
  ...inputStyle, background: 'rgba(0,0,0,0.2)'
};

const btnStyle = {
  background: 'var(--color-primary)', color: '#111', border: 'none',
  padding: '1rem 2rem', borderRadius: '8px', cursor: 'pointer',
  fontWeight: '600', fontSize: '1rem', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '1px'
};

const iconBtnStyle = {
  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
  width: '40px', height: '40px', borderRadius: '8px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
};

const colorPickerStyle = {
  width: '40px', height: '40px', padding: '0', border: 'none', cursor: 'pointer',
  background: 'transparent', borderRadius: '4px'
};

const dividerStyle = {
  height: '1px', background: '#333', margin: '2rem 0'
};
