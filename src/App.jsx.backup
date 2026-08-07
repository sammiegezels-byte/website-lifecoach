import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Heart, TrendingUp, Menu, X, ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
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

const useAnimations = () => {
  const { content } = useCMS();
  const isEnabled = content.animationsEnabled !== false;
  
  const variants = isEnabled ? {
    fadeUp: { hidden: { opacity: 0, y: 50, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, type: "spring", bounce: 0.4 } } },
    slideInLeft: { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0, transition: { duration: 0.8, type: "spring", bounce: 0.3 } } },
    slideInRight: { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0, transition: { duration: 0.8, type: "spring", bounce: 0.3 } } },
    popIn: { hidden: { opacity: 0, scale: 0.8, rotate: -5 }, visible: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", bounce: 0.5, duration: 0.8 } } },
    staggerContainer: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } } }
  } : {
    fadeUp: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } },
    slideInLeft: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } },
    slideInRight: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } },
    popIn: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } },
    staggerContainer: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } }
  };

  const viewportProps = isEnabled ? { once: false, amount: 0.2 } : { once: true, margin: "-100px" };

  return { variants, viewportProps, isEnabled };
};

// --- Extracted Components for Sections ---

const HeroSection = () => {
  const { content, updateContent, isAdmin } = useCMS();
  const { variants } = useAnimations();
  return (
    <section id="home" className="hero" style={{ backgroundImage: `url(${content.heroImage})` }}>
      <div className="container">
        <motion.div className="hero-content" initial="hidden" animate="visible" variants={variants.popIn}>
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
  );
};

const AboutSection = () => {
  const { variants, viewportProps } = useAnimations();
  return (
    <section id="over-mij" className="about section-padding">
      <div className="container">
        <motion.div className="about-grid" initial="hidden" whileInView="visible" viewport={viewportProps} variants={variants.staggerContainer}>
          <motion.div className="about-text" variants={variants.slideInLeft}>
            <h2><EditableText fieldKey="aboutTitle" /></h2>
            <p><EditableText fieldKey="aboutText1" multiline /></p>
            <p><EditableText fieldKey="aboutText2" multiline /></p>
          </motion.div>
          <motion.div className="about-img" variants={variants.slideInRight}>
            <EditableImage fieldKey="aboutImage" alt="Portret Coach" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const ConsultationSection = () => {
  const { isAdmin } = useCMS();
  const { variants, viewportProps } = useAnimations();
  return (
    <section id="werk-met-mij" className="consultation section-padding">
      <div className="container">
        <motion.div className="consultation-grid" initial="hidden" whileInView="visible" viewport={viewportProps} variants={variants.staggerContainer}>
          <motion.div className="consultation-img" variants={variants.slideInLeft}>
            <EditableImage fieldKey="consultationImage" alt="Gratis Consultatie" />
          </motion.div>
          <motion.div className="consultation-text" variants={variants.slideInRight}>
            <h2><EditableText fieldKey="consultationTitle" /></h2>
            <p><EditableText fieldKey="consultationText" multiline /></p>
            <a href="#contact" className="btn btn-outline" onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="consultationBtnText" /></a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const ServicesSection = () => {
  const { isAdmin } = useCMS();
  const { variants, viewportProps, isEnabled } = useAnimations();
  const hoverAnim = isEnabled ? { y: -10, scale: 1.02 } : {};
  return (
    <section id="aanbod" className="services section-padding">
      <div className="container">
        <motion.h2 className="services-title" initial="hidden" whileInView="visible" viewport={{ ...viewportProps, amount: 0.5 }} variants={variants.fadeUp}>
          <EditableText fieldKey="servicesTitle" />
        </motion.h2>
        <motion.div className="services-grid" initial="hidden" whileInView="visible" viewport={{ ...viewportProps, amount: 0.1 }} variants={variants.staggerContainer}>
          <motion.div className="service-card" whileHover={hoverAnim} variants={variants.popIn}>
            <div className="service-icon"><Compass size={32} /></div>
            <div className="service-img-wrapper origin-right">
              <EditableImage fieldKey="card1Image" alt="Levensrichting" />
            </div>
            <h3><EditableText fieldKey="card1Title" /></h3>
            <p><EditableText fieldKey="card1Text" multiline /></p>
            <a href="#contact" className="btn btn-outline" style={{width: '100%'}} onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="servicesBtnText" /></a>
          </motion.div>
          <motion.div className="service-card" whileHover={hoverAnim} variants={variants.popIn}>
            <div className="service-icon"><Heart size={32} /></div>
            <div className="service-img-wrapper origin-center">
              <EditableImage fieldKey="card2Image" alt="Gezin & Relaties" />
            </div>
            <h3><EditableText fieldKey="card2Title" /></h3>
            <p><EditableText fieldKey="card2Text" multiline /></p>
            <a href="#contact" className="btn btn-outline" style={{width: '100%'}} onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="servicesBtnText" /></a>
          </motion.div>
          <motion.div className="service-card" whileHover={hoverAnim} variants={variants.popIn}>
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
  );
};

const ContactSection = () => {
  const { content, updateContent, isAdmin } = useCMS();
  const { variants, viewportProps } = useAnimations();
  return (
    <section id="contact" className="contact section-padding" style={{ backgroundImage: `url(${content.contactImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(250, 250, 247, 0.6)' }}></div>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div className="contact-container" initial="hidden" whileInView="visible" viewport={viewportProps} variants={variants.fadeUp}>
          <h2><EditableText fieldKey="contactTitle" /></h2>
          <p><EditableText fieldKey="contactSubtitle" /></p>
          <form className="contact-form" action="https://api.web3forms.com/submit" method="POST">
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
  );
};

const ParallaxSection = ({ id, imageKey, quoteKey }) => {
  const { content, updateContent, updateMultiple, isAdmin } = useCMS();
  const { variants, viewportProps } = useAnimations();

  const handleRemove = () => {
    if (window.confirm("Zeker dat je deze parallax wilt verwijderen?")) {
      const newOrder = (content.sectionOrder || []).filter(sId => sId !== id);
      updateMultiple({ sectionOrder: newOrder });
    }
  };

  return (
    <section id={id} className="quote-section" style={{ backgroundImage: `url(${content[imageKey]})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', position: 'relative', padding: '120px 0' }}>
      {isAdmin && id !== 'visie' && (
        <button onClick={handleRemove} style={{ position: 'absolute', top: 20, right: 20, background: '#e74c3c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', zIndex: 100, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Trash2 size={16} /> Verwijder Parallax
        </button>
      )}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)' }}></div>
      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.blockquote initial="hidden" whileInView="visible" viewport={{ ...viewportProps, amount: 0.3 }} variants={variants.popIn} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)', color: 'white', margin: 0 }}>
          <EditableText fieldKey={quoteKey} />
        </motion.blockquote>
        {isAdmin && (
           <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <label className="btn btn-outline" style={{ borderColor: 'white', color: 'white', cursor: 'pointer', position: 'relative', zIndex: 10 }}>
                Wijzig Achtergrondfoto
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const url = await uploadImageToCloudinary(file);
                    if (url) updateContent(imageKey, url);
                  }
                }} />
              </label>
           </div>
        )}
      </div>
    </section>
  );
};

const CustomSection = ({ sectionId }) => {
  const { content, updateMultiple, isAdmin } = useCMS();
  const { variants, viewportProps } = useAnimations();
  
  const handleRemove = () => {
    if (window.confirm("Zeker dat je deze sectie wilt verwijderen?")) {
      const newOrder = (content.sectionOrder || []).filter(id => id !== sectionId);
      const newCustoms = (content.customSections || []).filter(s => s.id !== sectionId);
      updateMultiple({ sectionOrder: newOrder, customSections: newCustoms });
    }
  };

  return (
    <section id={sectionId} className="about section-padding" style={{ position: 'relative' }}>
      {isAdmin && (
        <button onClick={handleRemove} style={{ position: 'absolute', top: 20, right: 20, background: '#e74c3c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', zIndex: 100, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Trash2 size={16} /> Verwijder Pagina
        </button>
      )}
      <div className="container">
        <motion.div className="about-grid" initial="hidden" whileInView="visible" viewport={viewportProps} variants={variants.staggerContainer}>
          <motion.div className="about-text" variants={variants.slideInLeft}>
            <h2><EditableText fieldKey={`customTitle_${sectionId}`} /></h2>
            <p><EditableText fieldKey={`customText_${sectionId}`} multiline /></p>
          </motion.div>
          <motion.div className="about-img" variants={variants.slideInRight}>
            <EditableImage fieldKey={`customImage_${sectionId}`} alt="Custom" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { content, updateMultiple, isAdmin, setShowLogin } = useCMS();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const headingFont = content.themeHeadingFont || 'Playfair Display';
    const bodyFont = content.themeBodyFont || 'Inter';
    const color = content.themeColor || '#8FAF8F';

    const linkId = 'dynamic-fonts';
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700&family=${bodyFont.replace(/ /g, '+')}:wght@300;400;600&display=swap`;

    document.documentElement.style.setProperty('--font-heading', `"${headingFont}", sans-serif`);
    document.documentElement.style.setProperty('--font-body', `"${bodyFont}", sans-serif`);
    document.documentElement.style.setProperty('--color-primary', color);
  }, [content.themeHeadingFont, content.themeBodyFont, content.themeColor]);

  const sectionOrder = content.sectionOrder || ['home', 'over-mij', 'parallax_1', 'visie', 'werk-met-mij', 'parallax_2', 'aanbod', 'contact'];

  const moveSection = (index, direction) => {
    if (!isAdmin) return;
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
    const newOrder = [...sectionOrder];
    
    let insertIdx = newOrder.indexOf('contact');
    if (insertIdx === -1) insertIdx = newOrder.length;

    newOrder.splice(insertIdx, 0, newId);

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
    const newOrder = [...sectionOrder];
    
    let insertIdx = newOrder.indexOf('contact');
    if (insertIdx === -1) insertIdx = newOrder.length;
    
    newOrder.splice(insertIdx, 0, newId);
    
    updateMultiple({
      sectionOrder: newOrder,
      [`${newId}Image`]: "/images/parallax_1.png",
      [`${newId}Quote`]: "Nieuwe inspirerende quote hier."
    });
  };

  const getMenuLabel = (id) => {
    if (id === 'home') return 'Home';
    if (id === 'over-mij') return 'Over Mij';
    if (id === 'visie') return 'Mijn visie';
    if (id === 'werk-met-mij') return 'Werk met mij';
    if (id === 'aanbod') return 'Aanbod';
    if (id === 'contact' || id.startsWith('parallax')) return null;
    const custom = (content.customSections || []).find(s => s.id === id);
    if (custom) return content[`customTitle_${id}`] || 'Nieuwe Pagina';
    return null;
  };

  return (
    <div className="app">
      <AdminModals />
      
      {/* NAVIGATIEBALK */}
      <nav className="navbar" style={{ padding: isScrolled ? '1rem 0' : '1.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo"><EditableText fieldKey="footerLogo" /></div>
          
          <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {sectionOrder.map((id, index) => {
              const label = getMenuLabel(id);
              if (!label && !isAdmin) return null;
              if (!label && isAdmin && (id === 'contact' || id.startsWith('parallax'))) return null;
              
              if (!label) return null;

              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {isAdmin && (
                    <button onClick={() => moveSection(index, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-primary)' }}><ArrowLeft size={14}/></button>
                  )}
                  <a href={`#${id}`}>{label}</a>
                  {isAdmin && (
                    <button onClick={() => moveSection(index, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-primary)' }}><ArrowRight size={14}/></button>
                  )}
                </div>
              );
            })}
            
            <a href="#contact" className="btn" style={{ padding: '0.8rem 1.5rem', fontSize: '0.8rem' }} onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="navBtnText" /></a>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <main>
        {sectionOrder.map(id => {
          switch(id) {
            case 'home': return <HeroSection key={id} />;
            case 'over-mij': return <AboutSection key={id} />;
            case 'visie': return <ParallaxSection key={id} id={id} imageKey="quoteImage" quoteKey="quoteText" />;
            case 'werk-met-mij': return <ConsultationSection key={id} />;
            case 'aanbod': return <ServicesSection key={id} />;
            case 'contact': return <ContactSection key={id} />;
            case 'parallax_1': return <ParallaxSection key={id} id={id} imageKey="parallax1Image" quoteKey="parallax1Quote" />;
            case 'parallax_2': return <ParallaxSection key={id} id={id} imageKey="parallax2Image" quoteKey="parallax2Quote" />;
            default:
              if (id.startsWith('custom_')) return <CustomSection key={id} sectionId={id} />;
              if (id.startsWith('parallax_')) return <ParallaxSection key={id} id={id} imageKey={`${id}Image`} quoteKey={`${id}Quote`} />;
              return null;
          }
        })}
      </main>

      {/* FOOTER */}
      <footer>
        <div className="container">
          {isAdmin && (
             <div style={{ textAlign: 'center', marginBottom: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn" onClick={addCustomSection} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '1rem 2rem' }}>
                  <Plus size={20} /> Nieuwe Pagina
                </button>
                <button className="btn btn-outline" onClick={addParallaxSection} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '1rem 2rem' }}>
                  <Plus size={20} /> Nieuwe Foto
                </button>
             </div>
          )}
          <div className="footer-content">
            <div className="footer-logo"><EditableText fieldKey="footerLogo" /></div>
            
            <div className="footer-links">
              {sectionOrder.map(id => {
                const label = getMenuLabel(id);
                if (label) return <a key={id} href={`#${id}`}>{label}</a>;
                return null;
              })}
            </div>

            <div className="social-icons">
              <a href={content.instagramLink} target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram"><InstagramIcon /></a>
              <a href={content.facebookLink} target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Facebook"><FacebookIcon /></a>
              <a href={content.linkedinLink} target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn"><LinkedinIcon /></a>
            </div>
          </div>
          <div className="copyright" onDoubleClick={() => setShowLogin(true)} style={{ cursor: 'pointer', userSelect: 'none' }}>
            <EditableText fieldKey="footerCopyright" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
