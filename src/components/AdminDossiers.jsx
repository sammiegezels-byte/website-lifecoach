import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { X, Plus, Trash2, Save, Download, FileText, User } from 'lucide-react';
import { RichTextEditor } from './AdminModals';

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
  zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const panelStyle = {
  backgroundColor: '#1a1a1a', borderRadius: '12px', width: '90%', maxWidth: '1200px',
  height: '85vh', display: 'flex', overflow: 'hidden', border: '1px solid #333',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

const iconBtnStyle = {
  background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
  padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '8px', transition: 'all 0.2s'
};

export const AdminDossiers = ({ close }) => {
  const [dossiers, setDossiers] = useState([]);
  const [selectedDossierId, setSelectedDossierId] = useState(null);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [currentContent, setCurrentContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'dossiers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      const now = Date.now();
      const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
      
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const lastUp = d.lastUpdated ? d.lastUpdated.toMillis() : now;
        
        if (now - lastUp > TWO_YEARS_MS) {
          console.log(`Dossier ${docSnap.id} is ouder dan 2 jaar, bezig met verwijderen...`);
          deleteDoc(doc(db, 'dossiers', docSnap.id)).catch(console.error);
        } else {
          data.push({ id: docSnap.id, ...d });
        }
      });
      setDossiers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const selectedDossier = dossiers.find(d => d.id === selectedDossierId);
  const subDossiers = selectedDossier?.subDossiers || [];
  const activeSub = subDossiers[selectedSubIndex];

  useEffect(() => {
    if (activeSub) {
      setCurrentContent(activeSub.content || '');
    } else {
      setCurrentContent('');
    }
  }, [activeSub]);

  const handleCreateDossier = async () => {
    const name = window.prompt("Naam van het nieuwe dossier (bijv. Familie Peeters):");
    if (!name || name.trim() === "") return;
    
    const newDocRef = doc(collection(db, 'dossiers'));
    await setDoc(newDocRef, {
      name: name.trim(),
      lastUpdated: serverTimestamp(),
      subDossiers: [
        { id: Date.now().toString(), name: "Hoofddossier", content: "" }
      ]
    });
    setSelectedDossierId(newDocRef.id);
    setSelectedSubIndex(0);
  };

  const handleDeleteDossier = async (id, name) => {
    if (window.confirm(`Weet je zeker dat je het volledige dossier van "${name}" wilt verwijderen?`)) {
      if (selectedDossierId === id) setSelectedDossierId(null);
      await deleteDoc(doc(db, 'dossiers', id));
    }
  };

  const handleCreateSubDossier = async () => {
    if (!selectedDossier) return;
    const name = window.prompt("Naam van het sub-dossier (bijv. Ouder 1, Kind 2):");
    if (!name || name.trim() === "") return;

    const newSub = { id: Date.now().toString(), name: name.trim(), content: "" };
    const newSubs = [...subDossiers, newSub];
    
    await setDoc(doc(db, 'dossiers', selectedDossier.id), {
      subDossiers: newSubs,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    setSelectedSubIndex(newSubs.length - 1);
  };

  const handleSaveSubContent = async () => {
    if (!selectedDossier || !activeSub) return;
    setIsSaving(true);
    
    const newSubs = [...subDossiers];
    newSubs[selectedSubIndex] = { ...activeSub, content: currentContent };
    
    try {
      await setDoc(doc(db, 'dossiers', selectedDossier.id), {
        subDossiers: newSubs,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch(e) {
      console.error(e);
      alert("Fout bij opslaan");
    }
    setIsSaving(false);
  };

  const handleDeleteSubDossier = async (idx) => {
    if (!selectedDossier) return;
    if (subDossiers.length === 1) {
      alert("Een dossier moet minimaal één sub-dossier (tabblad) bevatten.");
      return;
    }
    if (window.confirm(`Weet je zeker dat je dit tabblad (${subDossiers[idx].name}) wilt verwijderen?`)) {
      const newSubs = subDossiers.filter((_, i) => i !== idx);
      await setDoc(doc(db, 'dossiers', selectedDossier.id), {
        subDossiers: newSubs,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      setSelectedSubIndex(Math.max(0, idx - 1));
    }
  };

  const handleDownload = () => {
    if (!selectedDossier || !activeSub) return;
    
    const docName = `${selectedDossier.name} - ${activeSub.name}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${docName}</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; color: #000; }
          h1 { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
          .date { color: #666; font-size: 0.9em; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <h1>${docName}</h1>
        <div class="date">Gedownload op: ${new Date().toLocaleDateString('nl-NL')}</div>
        <div>${currentContent}</div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        
        {/* Sidebar */}
        <div style={{ width: '300px', backgroundColor: '#111', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20}/> Dossiers
            </h2>
            <button onClick={handleCreateDossier} style={{...iconBtnStyle, backgroundColor: 'var(--color-primary)', padding: '0.4rem'}} title="Nieuw Dossier">
              <Plus size={18} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
            {loading ? (
              <p style={{ color: '#888', textAlign: 'center' }}>Laden...</p>
            ) : dossiers.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>Geen dossiers gevonden.</p>
            ) : (
              dossiers.map(d => (
                <div 
                  key={d.id} 
                  style={{ 
                    padding: '1rem 1.5rem', 
                    cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: selectedDossierId === d.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderLeft: selectedDossierId === d.id ? '3px solid var(--color-primary)' : '3px solid transparent'
                  }}
                  onClick={() => { setSelectedDossierId(d.id); setSelectedSubIndex(0); }}
                >
                  <span style={{ color: selectedDossierId === d.id ? '#fff' : '#aaa', fontWeight: selectedDossierId === d.id ? 'bold' : 'normal' }}>
                    {d.name}
                  </span>
                  {selectedDossierId === d.id && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDossier(d.id, d.name); }} style={{...iconBtnStyle, color: '#ff4444', padding: '0.2rem'}}>
                      <Trash2 size={16}/>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a', position: 'relative' }}>
          
          <button onClick={close} style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, ...iconBtnStyle, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <X size={24} />
          </button>

          {!selectedDossier ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', flexDirection: 'column', gap: '1rem' }}>
              <FileText size={48} opacity={0.5} />
              <p>Selecteer een dossier of maak een nieuwe aan.</p>
            </div>
          ) : (
            <>
              {/* Tabbladen */}
              <div style={{ display: 'flex', padding: '1.5rem 1.5rem 0', borderBottom: '1px solid #333', overflowX: 'auto', gap: '0.5rem' }}>
                {subDossiers.map((sub, idx) => (
                  <div 
                    key={sub.id} 
                    style={{ 
                      padding: '0.8rem 1.5rem', 
                      backgroundColor: selectedSubIndex === idx ? '#2a2a2a' : 'transparent',
                      color: selectedSubIndex === idx ? '#fff' : '#888',
                      borderRadius: '8px 8px 0 0',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      border: '1px solid',
                      borderColor: selectedSubIndex === idx ? '#333 #333 transparent' : 'transparent',
                      borderBottom: 'none'
                    }}
                    onClick={() => setSelectedSubIndex(idx)}
                  >
                    {sub.name}
                  </div>
                ))}
                <button onClick={handleCreateSubDossier} style={{...iconBtnStyle, padding: '0.8rem', color: 'var(--color-primary)'}} title="Nieuw tabblad">
                  <Plus size={18} />
                </button>
              </div>

              {/* Toolbar & Editor */}
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {activeSub && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h1 style={{ margin: 0, color: '#fff', fontSize: '1.8rem' }}>{selectedDossier.name} - <span style={{ color: 'var(--color-primary)' }}>{activeSub.name}</span></h1>
                      
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => handleDeleteSubDossier(selectedSubIndex)} style={{...iconBtnStyle, backgroundColor: '#332222', color: '#ff4444', padding: '0.5rem 1rem'}}>
                          <Trash2 size={18}/>
                        </button>
                        <button onClick={handleDownload} style={{...iconBtnStyle, backgroundColor: '#223344', color: '#66bbff', padding: '0.5rem 1rem'}}>
                          <Download size={18}/> <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>Download</span>
                        </button>
                        <button onClick={handleSaveSubContent} style={{...iconBtnStyle, backgroundColor: 'var(--color-primary)', padding: '0.5rem 1.5rem'}}>
                          <Save size={18}/> <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>{isSaving ? 'Opslaan...' : 'Opslaan'}</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>Typ hieronder net zoals in een Word document. Je tekst wordt bewaard als je op 'Opslaan' klikt.</p>
                      
                      <RichTextEditor 
                        value={currentContent} 
                        onChange={setCurrentContent} 
                        multiline={true} 
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
