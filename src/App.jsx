import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Heart, TrendingUp, Menu, X } from 'lucide-react';
import { useCMS, EditableText, EditableImage, uploadImageToCloudinary } from './cms';
import { AdminModals } from './components/AdminModals';
import './index.css';

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Instagram">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Facebook">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="LinkedIn">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { content, updateContent, isAdmin, setShowLogin } = useCMS();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app">
      <AdminModals />
      
      {/* STAP 1 — NAVIGATIEBALK */}
      <nav className="navbar" style={{ padding: isScrolled ? '1rem 0' : '1.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo"><EditableText fieldKey="footerLogo" /></div>
          
          <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#home">Home</a>
            <a href="#over-mij">Over Mij</a>
            <a href="#visie">Mijn visie</a>
            <a href="#werk-met-mij">Werk met mij</a>
            <a href="#aanbod">Aanbod</a>
            <a href="#contact">Contact</a>
            <a href="#contact" className="btn" style={{ padding: '0.8rem 1.5rem', fontSize: '0.8rem' }} onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="navBtnText" /></a>
          </div>

          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu openen"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <main>
      {/* STAP 2 — HERO SECTIE */}
      <section 
        id="home" 
        className="hero" 
        style={{ backgroundImage: `url(${content.heroImage})` }}
      >
        <div className="container">
          <motion.div 
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <h1><EditableText fieldKey="heroTitle" /></h1>
            <p><EditableText fieldKey="heroSubtitle" /></p>
            <a href="#contact" className="btn" onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="heroBtnText" /></a>
          </motion.div>
          {isAdmin && (
             <div style={{ marginTop: '2rem', position: 'relative', zIndex: 10 }}>
                <label className="btn btn-outline" style={{ borderColor: 'white', color: 'white', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  Wijzig Achtergrondfoto Hero
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await uploadImageToCloudinary(file);
                      if (url) updateContent('heroImage', url);
                    }
                  }} />
                </label>
             </div>
          )}
        </div>
      </section>

      {/* STAP 3 — OVER MIJ SECTIE */}
      <section id="over-mij" className="about section-padding">
        <div className="container">
          <motion.div 
            className="about-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="about-text" variants={fadeUp}>
              <h2><EditableText fieldKey="aboutTitle" /></h2>
              <p><EditableText fieldKey="aboutText1" multiline /></p>
              <p><EditableText fieldKey="aboutText2" multiline /></p>
            </motion.div>
            <motion.div className="about-img" variants={fadeUp}>
              <EditableImage fieldKey="aboutImage" alt="Portret Coach" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STAP 4 — MIJN VISIE SECTIE (Voormalig Quote) */}
      <section 
        id="visie"
        className="quote-section"
        style={{ 
          backgroundImage: `url(${content.quoteImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(143, 175, 143, 0.85)' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.blockquote 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
          >
            "<EditableText fieldKey="quoteText" />"
          </motion.blockquote>
          {isAdmin && (
             <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <label className="btn btn-outline" style={{ borderColor: 'white', color: 'white', cursor: 'pointer', position: 'relative', zIndex: 10 }}>
                  Wijzig Achtergrondfoto
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await uploadImageToCloudinary(file);
                      if (url) updateContent('quoteImage', url);
                    }
                  }} />
                </label>
             </div>
          )}
        </div>
      </section>

      {/* STAP 5 — WERK MET MIJ SECTIE (Voormalig Consultatie) */}
      <section id="werk-met-mij" className="consultation section-padding">
        <div className="container">
          <motion.div 
            className="consultation-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="consultation-img" variants={fadeUp}>
              <EditableImage fieldKey="consultationImage" alt="Gratis Consultatie" />
            </motion.div>
            <motion.div className="consultation-text" variants={fadeUp}>
              <h2><EditableText fieldKey="consultationTitle" /></h2>
              <p><EditableText fieldKey="consultationText" multiline /></p>
              <a href="#contact" className="btn btn-outline" onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="consultationBtnText" /></a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STAP 6 — AANBOD SECTIE (Voormalig Diensten/Coaching) */}
      <section id="aanbod" className="services section-padding">
        <div className="container">
          <motion.h2 
            className="services-title"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <EditableText fieldKey="servicesTitle" />
          </motion.h2>
          
          <motion.div 
            className="services-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div className="service-card" variants={fadeUp}>
              <div className="service-icon"><Compass size={32} /></div>
              <div className="service-img-wrapper origin-right">
                <EditableImage fieldKey="card1Image" alt="Levensrichting" />
              </div>
              <h3><EditableText fieldKey="card1Title" /></h3>
              <p><EditableText fieldKey="card1Text" multiline /></p>
              <a href="#contact" className="btn btn-outline" style={{width: '100%'}} onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="servicesBtnText" /></a>
            </motion.div>

            <motion.div className="service-card" variants={fadeUp}>
              <div className="service-icon"><Heart size={32} /></div>
              <div className="service-img-wrapper origin-center">
                <EditableImage fieldKey="card2Image" alt="Gezin & Relaties" />
              </div>
              <h3><EditableText fieldKey="card2Title" /></h3>
              <p><EditableText fieldKey="card2Text" multiline /></p>
              <a href="#contact" className="btn btn-outline" style={{width: '100%'}} onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="servicesBtnText" /></a>
            </motion.div>

            <motion.div className="service-card" variants={fadeUp}>
              <div className="service-icon"><TrendingUp size={32} /></div>
              <div className="service-img-wrapper origin-left">
                <EditableImage fieldKey="card3Image" alt="1:1 Life Coaching" />
              </div>
              <h3><EditableText fieldKey="card3Title" /></h3>
              <p><EditableText fieldKey="card3Text" multiline /></p>
              <a href="#contact" className="btn btn-outline" style={{width: '100%'}} onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="servicesBtnText" /></a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STAP 7 — CONTACT SECTIE */}
      <section 
        id="contact" 
        className="contact section-padding"
        style={{ 
          backgroundImage: `url(${content.contactImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(250, 250, 247, 0.6)' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div 
            className="contact-container"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2><EditableText fieldKey="contactTitle" /></h2>
            <p><EditableText fieldKey="contactSubtitle" /></p>
            
            <form 
              className="contact-form" 
              action="https://api.web3forms.com/submit" 
              method="POST"
            >
              <input type="hidden" name="access_key" value={content.web3formsKey || ''} />
              <input type="hidden" name="subject" value="Nieuw bericht via de coaching website!" />
              <input type="hidden" name="redirect" value={window.location.href} />

              <div className="form-group">
                <input type="text" name="name" placeholder="Naam" required />
              </div>
              <div className="form-group">
                <input type="email" name="email" placeholder="E-mailadres" required />
              </div>
              <div className="form-group full-width">
                <input type="tel" name="phone" placeholder="Telefoonnummer (optioneel)" />
              </div>
              <div className="form-group full-width">
                <textarea name="message" placeholder="Jouw bericht" required></textarea>
              </div>
              <button type="submit" className="btn">Verstuur Bericht</button>
            </form>
          </motion.div>
          {isAdmin && (
             <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <label className="btn btn-outline" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-text)', backgroundColor: '#fff', cursor: 'pointer', position: 'relative', zIndex: 10 }}>
                  Wijzig Achtergrondfoto Contact
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await uploadImageToCloudinary(file);
                      if (url) updateContent('contactImage', url);
                    }
                  }} />
                </label>
             </div>
          )}
        </div>
      </section>

      </main>

      {/* STAP 8 — FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo"><EditableText fieldKey="footerLogo" /></div>
            
            <div className="footer-links">
              <a href="#home">Home</a>
              <a href="#over-mij">Over Mij</a>
              <a href="#visie">Mijn visie</a>
              <a href="#werk-met-mij">Werk met mij</a>
              <a href="#aanbod">Aanbod</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="social-icons">
              <a href={content.instagramLink} target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram"><InstagramIcon /></a>
              <a href={content.facebookLink} target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Facebook"><FacebookIcon /></a>
              <a href={content.linkedinLink} target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn"><LinkedinIcon /></a>
            </div>
          </div>
          <div 
            className="copyright" 
            onDoubleClick={() => setShowLogin(true)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <EditableText fieldKey="footerCopyright" />
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
