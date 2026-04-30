import React, { useState } from 'react';
import { useCMS } from '../cms';
import { Settings, LogOut, X } from 'lucide-react';

export function AdminModals() {
  const { content, updateContent, isAdmin, setIsAdmin, showLogin, setShowLogin, showSettings, setShowSettings } = useCMS();
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");

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

  return (
    <>
      {/* Login Modal */}
      {showLogin && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => setShowLogin(false)} style={closeBtnStyle}><X size={20}/></button>
            <h3 style={{marginBottom: '1rem'}}>Beheerder Login</h3>
            <form onSubmit={handleLogin}>
              <input 
                type="password" 
                placeholder="Voer pincode in" 
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={inputStyle}
                autoFocus
              />
              {error && <p style={{color: 'red', fontSize: '0.8rem', marginTop: '0.5rem'}}>{error}</p>}
              <button type="submit" className="btn" style={{marginTop: '1rem', width: '100%'}}>Inloggen</button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && isAdmin && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => setShowSettings(false)} style={closeBtnStyle}><X size={20}/></button>
            <h3 style={{marginBottom: '1.5rem'}}>Instellingen</h3>
            
            <div style={{marginBottom: '1.5rem'}}>
              <label style={labelStyle}>E-mailadres voor contactformulier</label>
              <input 
                type="email" 
                value={content.contactEmail}
                onChange={(e) => updateContent('contactEmail', e.target.value)}
                style={inputStyle}
              />
              <p style={{fontSize: '0.8rem', color: '#666', marginTop: '0.3rem'}}>
                Alle berichten van klanten worden naar dit e-mailadres gestuurd via FormSubmit.co.
              </p>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label style={labelStyle}>Nieuwe Pincode (4 tot 8 cijfers)</label>
              <input 
                type="text" 
                value={content.pin}
                onChange={(e) => updateContent('pin', e.target.value)}
                style={inputStyle}
                maxLength={8}
              />
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label style={labelStyle}>Instagram Link</label>
              <input 
                type="url" 
                value={content.instagramLink || ""}
                onChange={(e) => updateContent('instagramLink', e.target.value)}
                style={inputStyle}
                placeholder="https://instagram.com/..."
              />
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label style={labelStyle}>Facebook Link</label>
              <input 
                type="url" 
                value={content.facebookLink || ""}
                onChange={(e) => updateContent('facebookLink', e.target.value)}
                style={inputStyle}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label style={labelStyle}>LinkedIn Link</label>
              <input 
                type="url" 
                value={content.linkedinLink || ""}
                onChange={(e) => updateContent('linkedinLink', e.target.value)}
                style={inputStyle}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            
            <button onClick={() => setShowSettings(false)} className="btn" style={{width: '100%'}}>Opslaan & Sluiten</button>
          </div>
        </div>
      )}

      {/* Admin Floating Bar */}
      {isAdmin && (
        <div style={adminBarStyle}>
          <div>Ingelogd als beheerder. Klik op teksten en foto's om ze te wijzigen.</div>
          <div style={{display: 'flex', gap: '1rem'}}>
            <button onClick={() => setShowSettings(true)} style={adminBtnStyle} aria-label="Instellingen">
              <Settings size={18} /> Instellingen
            </button>
            <button onClick={() => setIsAdmin(false)} style={adminBtnStyle} aria-label="Uitloggen">
              <LogOut size={18} /> Uitloggen
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  backdropFilter: 'blur(5px)'
};

const modalContentStyle = {
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '400px',
  maxHeight: '90vh',
  overflowY: 'auto',
  position: 'relative',
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
};

const closeBtnStyle = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#666'
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem',
  fontFamily: 'inherit'
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '600',
  fontSize: '0.9rem'
};

const adminBarStyle = {
  position: 'fixed',
  top: '100px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#333',
  color: '#fff',
  padding: '1rem 2rem',
  borderRadius: '50px',
  display: 'flex',
  alignItems: 'center',
  gap: '2rem',
  zIndex: 9998,
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  fontSize: '0.9rem'
};

const adminBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  color: '#fff',
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  cursor: 'pointer',
  transition: 'all 0.2s'
};
