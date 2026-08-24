import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { motion } from 'framer-motion';
import { Compass, Heart, TrendingUp, Menu, X, ArrowLeft, ArrowRight, Plus, Trash2, Check } from 'lucide-react';
import { useCMS, EditableText, EditableImage, EditableVideo } from './cms';

const AdminModals = lazy(() => import('./components/AdminModals').then(module => ({ default: module.AdminModals })));
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

const BlockButton = ({ b }) => {
  const [expanded, setExpanded] = useState(false);
  const isExpandType = b.actionType === 'expand' || (!b.link && b.expandText);

  if (isExpandType) {
    return (
      <div style={{ textAlign: b.align || 'center', width: '100%' }}>
        <button 
          type="button" 
          className="btn" 
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'inline-block', fontSize: '1.1rem', padding: '1rem 3rem', cursor: 'pointer' }}
        >
          {b.label || 'Knop'}
        </button>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
            style={{ 
              backgroundColor: '#fff', 
              border: '1px solid #eee', 
              borderRadius: '12px', 
              padding: '2rem', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8',
              maxWidth: '800px',
              margin: '1.5rem auto 0 auto',
              color: 'var(--color-text)'
            }}
          >
            {b.expandText || b.text || 'Geen tekst ingesteld.'}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div style={{ textAlign: b.align || 'center' }}>
      <a href={b.link || '#contact'} className="btn" style={{ display: 'inline-block', fontSize: '1.1rem', padding: '1rem 3rem' }}>{b.label || 'Knop'}</a>
    </div>
  );
};

const RenderBlocks = ({ blocks }) => {
  const { variants, viewportProps } = useAnimations();
  if (!blocks || blocks.length === 0) return null;
  
  const getWidth = (b) => b.width || '100%';
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', width: '100%', marginTop: '3rem' }}>
      {blocks.map(b => (
        <motion.div key={b.id} initial="hidden" whileInView="visible" viewport={viewportProps} variants={variants.fadeUp} style={{ width: `calc(${getWidth(b)} - 1rem)`, minWidth: '250px', flexGrow: getWidth(b) === '100%' ? 1 : 0, boxSizing: 'border-box' }}>
          {b.type === 'text' && <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.1rem', color: b.color || 'var(--color-text)', textAlign: b.align || 'left', background: b.bgColor || 'transparent', padding: b.bgColor ? '2rem' : 0, borderRadius: b.bgColor ? '12px' : 0 }}>{b.text}</div>}
          {b.type === 'image' && b.url && (
            <div style={{ display: 'flex', justifyContent: b.align === 'left' ? 'flex-start' : b.align === 'right' ? 'flex-end' : 'center' }}>
              <img src={b.url} alt="" style={{ maxWidth: '100%', height: 'auto', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
            </div>
          )}
          {b.type === 'accordion' && (
            <details style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <summary style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                {b.title}
              </summary>
              <p style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--color-text-light)', textAlign: 'left' }}>{b.content}</p>
            </details>
          )}
          {b.type === 'button' && (
            <BlockButton b={b} />
          )}
        </motion.div>
      ))}
    </div>
  );
};

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

const VideoBackground = ({ url, invert }) => {
  if (!url) return null;
  return (
    <video
      src={url}
      autoPlay
      loop
      muted
      playsInline
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0,
        mixBlendMode: invert ? 'multiply' : 'screen',
        filter: invert ? 'invert(1)' : 'none',
        opacity: invert ? 0.5 : 1,
        pointerEvents: 'none'
      }}
    />
  );
};

const ThemeEffectOverlay = ({ sectionId, content }) => {
  const enabled = content[`themeEffectEnabled_${sectionId}`] !== false;
  if (!enabled) return null;
  const color = content[`glowColor_${sectionId}`] || content.themeColor || '#8FAF8F';

  return (
    <motion.div
      animate={{ opacity: [0.6, 0.8, 0.6] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 80%)`,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
};

const getSectionStyle = (sectionId, content, baseStyle = {}) => ({
  ...baseStyle,
  '--font-heading': content[`themeHeadingFont_${sectionId}`] ? `"${content[`themeHeadingFont_${sectionId}`]}", sans-serif` : undefined,
  '--font-body': content[`themeBodyFont_${sectionId}`] ? `"${content[`themeBodyFont_${sectionId}`]}", sans-serif` : undefined
});

const HeroSection = () => {
  const { content, updateContent, isAdmin } = useCMS();
  const { variants } = useAnimations();
  return (
    <section id="home" className="hero" style={getSectionStyle('home', content, { backgroundImage: `url(${content.heroImage})`, position: 'relative' })}>
      <VideoBackground url={content.heroBgVideo} invert={content.invertVideo_hero} />
      {content.heroImage && (
        <link rel="preload" as="image" href={content.heroImage} fetchPriority="high" />
      )}
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div className="hero-content" initial="hidden" animate="visible" variants={variants.popIn}>
          <h1><EditableText fieldKey="heroTitle" /></h1>
          <div style={{ marginBottom: '1rem' }}><EditableText fieldKey="heroSubtitle" /></div>
          <a href="#contact" className="btn" onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="heroBtnText" /></a>
        </motion.div>
      </div>
    </section>
  );
};

const AboutSection = () => {
  const { content, isAdmin } = useCMS();
  const { variants, viewportProps, isEnabled } = useAnimations();
  const [isExpanded, setIsExpanded] = useState(false);

  const cardVariants = isEnabled ? {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.2, ease: [0.2, 0.8, 0.2, 1] } }
  } : variants.fadeUp;

  return (
    <section id="over-mij" className="about-glass-section section-padding" style={getSectionStyle('over', content, { position: 'relative', overflow: 'hidden' })}>
      <ThemeEffectOverlay sectionId="over" content={content} />
      <VideoBackground url={content.customBgVideo_over} invert={content.invertVideo_over} />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <motion.div className="glass-content" initial="hidden" whileInView="visible" viewport={viewportProps} variants={variants.staggerContainer}>
          
          <motion.div className="glass-title-container" variants={cardVariants}>
            <h2 className="glass-title"><EditableText fieldKey="aboutTitle" /></h2>
          </motion.div>
          
          <motion.div variants={cardVariants} style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-card" style={{ padding: '1.5rem', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div className="card-image-wrapper" style={{ margin: 0, paddingTop: 0, width: '100%' }}>
                  <EditableImage fieldKey="aboutImage" alt="Portret Coach" />
               </div>
            </div>
          </motion.div>
          
          <motion.div variants={cardVariants} style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
             {!isExpanded ? (
               <button className="btn" onClick={() => setIsExpanded(true)}><EditableText fieldKey="aboutBtnMoreText" /></button>
             ) : (
               <button className="btn btn-outline" onClick={() => setIsExpanded(false)}><EditableText fieldKey="aboutBtnLessText" /></button>
             )}
          </motion.div>

          {isExpanded && (
             <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                animate={{ opacity: 1, height: 'auto', marginTop: '2rem' }} 
                style={{ 
                   backgroundColor: '#f9f9f9', 
                   border: '1px solid #eaeaea',
                   borderRadius: '16px', 
                   padding: '2rem', 
                   maxHeight: '350px',
                   overflowY: 'auto',
                   color: 'var(--color-text)',
                   boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.03)',
                   maxWidth: '800px',
                   margin: '0 auto'
                }}
                className="about-scroll-area"
             >
                <div style={{ marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: '1.8' }}>
                   <EditableText fieldKey="aboutText1" multiline />
                </div>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                   <EditableText fieldKey="aboutText2" multiline />
                </div>
             </motion.div>
          )}

        </motion.div>
        <RenderBlocks blocks={content.customBlocks_about} />
      </div>
    </section>
  );
};

const ConsultationSection = () => {
  const { content, isAdmin } = useCMS();
  const { variants, viewportProps, isEnabled } = useAnimations();
  const [isExpanded, setIsExpanded] = useState(false);

  const cardVariants = isEnabled ? {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.2, ease: [0.2, 0.8, 0.2, 1] } }
  } : variants.fadeUp;

  return (
    <section id="werk-met-mij" className="consultation section-padding" style={getSectionStyle('consult', content, { position: 'relative', overflow: 'hidden' })}>
      <ThemeEffectOverlay sectionId="consult" content={content} />
      <VideoBackground url={content.customBgVideo_consult} invert={content.invertVideo_consult} />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <motion.div className="glass-content" initial="hidden" whileInView="visible" viewport={viewportProps} variants={variants.staggerContainer}>
          
          <motion.div variants={cardVariants} style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-card" style={{ padding: '1.5rem', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div className="card-image-wrapper" style={{ margin: 0, paddingTop: 0, width: '100%' }}>
                  <EditableImage fieldKey="consultationImage" alt="Mijn Visie" />
               </div>
            </div>
          </motion.div>
          
          <motion.div variants={cardVariants} style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
             {!isExpanded ? (
               <button className="btn" onClick={() => setIsExpanded(true)}><EditableText fieldKey="consultationBtnMoreText" /></button>
             ) : (
               <button className="btn btn-outline" onClick={() => setIsExpanded(false)}><EditableText fieldKey="consultationBtnLessText" /></button>
             )}
          </motion.div>

          {isExpanded && (
             <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                animate={{ opacity: 1, height: 'auto', marginTop: '2rem' }} 
                style={{ 
                   backgroundColor: '#f9f9f9', 
                   border: '1px solid #eaeaea',
                   borderRadius: '16px', 
                   padding: '2rem', 
                   maxHeight: '400px',
                   overflowY: 'auto',
                   color: 'var(--color-text)',
                   boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.03)',
                   maxWidth: '800px',
                   margin: '0 auto',
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center'
                }}
                className="about-scroll-area"
             >
                <div style={{ marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.8', width: '100%' }}>
                   <EditableText fieldKey="consultationText" multiline />
                </div>
                
                <a href="#contact" className="btn" onClick={(e) => isAdmin && e.preventDefault()}>
                  <EditableText fieldKey="consultationBtnText" />
                </a>
             </motion.div>
          )}

        </motion.div>
        <RenderBlocks blocks={content.customBlocks_consult} />
      </div>
    </section>
  );
};

const AnimatedServiceBlock = ({ icon: Icon, imageKey, titleKey, textKey, originClass }) => {
  return (
    <motion.div 
      className="service-card" 
      style={{ display: 'flex', flexDirection: 'column', height: '100%', opacity: 0 }}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, when: "beforeChildren" } }
      }}
    >
      <div className={`service-img-wrapper ${originClass}`} style={{ marginBottom: '1.5rem' }}>
        <EditableImage fieldKey={imageKey} alt="Dienst" />
      </div>
      
      <div className="service-icon" style={{ alignSelf: 'center' }}><Icon size={32} /></div>
      <h3 style={{ textAlign: 'center' }}><EditableText fieldKey={titleKey} /></h3>
      
      <motion.div
        variants={{
          hidden: { opacity: 0, height: 0 },
          visible: { opacity: 1, height: 'auto', transition: { duration: 2.0, ease: "easeInOut" } }
        }}
        style={{ overflow: 'hidden', flexGrow: 1, width: '100%' }}
      >
        <div style={{ marginBottom: '1rem' }}><EditableText fieldKey={textKey} multiline /></div>
      </motion.div>
    </motion.div>
  );
};

const LumaKeyFilter = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
    <filter id="remove-black" colorInterpolationFilters="sRGB">
      <feColorMatrix
        type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                1.5 1.5 1.5 0 0" />
    </filter>
  </svg>
);

const ServicesSection = () => {
  const { content, isAdmin } = useCMS();
  const { variants: baseVariants, viewportProps } = useAnimations();
  const [isOpen, setIsOpen] = useState(false);

  const sequenceVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 4.5 }
    }
  };

  return (
    <section id="aanbod" className="services section-padding" style={getSectionStyle('aanbod', content, { position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' })}>
      <ThemeEffectOverlay sectionId="aanbod" content={content} />
      <VideoBackground url={content.customBgVideo_aanbod} invert={content.invertVideo_aanbod} />
      <div className="container" style={{ width: '100%', position: 'relative', zIndex: 2 }}>
        <motion.h2 className="services-title" initial="hidden" whileInView="visible" viewport={{ ...viewportProps, amount: 0.5 }} variants={baseVariants.fadeUp} style={{ marginBottom: '3rem' }}>
          <EditableText fieldKey="servicesTitle" />
        </motion.h2>
        
        {!isOpen ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.6 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}
          >
            <div style={{ width: '100%', borderRadius: '20px', overflow: 'hidden' }}>
              <LumaKeyFilter />
              {content.servicesMainVideo ? (
                <EditableVideo fieldKey="servicesMainVideo" style={{ width: '100%', height: 'auto', objectFit: 'cover', maxHeight: '500px', filter: 'url(#remove-black)' }} />
              ) : (
                <EditableImage fieldKey="servicesMainImage" alt="Werkwijze" style={{ width: '100%', height: 'auto', objectFit: 'cover', maxHeight: '500px' }} />
              )}
            </div>
            <button className="btn" onClick={() => setIsOpen(true)} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
              <EditableText fieldKey="servicesMainBtnText" />
            </button>
          </motion.div>
        ) : (
          <>
            <motion.div className="services-grid" variants={sequenceVariants} initial="hidden" animate="visible">
              <AnimatedServiceBlock icon={Compass} imageKey="card1Image" titleKey="card1Title" textKey="card1Text" originClass="origin-right" />
              <AnimatedServiceBlock icon={Heart} imageKey="card2Image" titleKey="card2Title" textKey="card2Text" originClass="origin-center" />
              <AnimatedServiceBlock icon={TrendingUp} imageKey="card3Image" titleKey="card3Title" textKey="card3Text" originClass="origin-left" />
            </motion.div>
            
            {content.servicesStepsBottomText && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 10, duration: 0.8 }}
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  border: '1px solid #eaeaea',
                  borderRadius: '16px', 
                  padding: '2rem', 
                  maxWidth: '850px', 
                  margin: '3rem auto 0 auto',
                  textAlign: 'left',
                  lineHeight: '1.8',
                  fontSize: '1.1rem',
                  color: 'var(--color-text)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                }}
              >
                <EditableText fieldKey="servicesStepsBottomText" multiline />
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 11.5, duration: 1 }}
              style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '4rem', flexWrap: 'wrap' }}
            >
              <a href="#contact" className="btn" onClick={(e) => isAdmin && e.preventDefault()}><EditableText fieldKey="servicesInterestBtnText" /></a>
              <button className="btn btn-outline" onClick={() => setIsOpen(false)}><EditableText fieldKey="servicesLessBtnText" /></button>
            </motion.div>
          </>
        )}
        <RenderBlocks blocks={content.customBlocks_aanbod} />
      </div>
    </section>
  );
};

const BookingWidget = ({ questionId, questionText }) => {
  const { content } = useCMS();
  const slots = content.availableSlots || [];
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const now = new Date();
  const validSlots = slots.filter(s => {
    if (!s.date || !s.time) return false;
    const slotDate = new Date(`${s.date}T${s.time}`);
    return slotDate > now;
  });

  const grouped = {};
  validSlots.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = [];
    if (!grouped[s.date].includes(s.time)) grouped[s.date].push(s.time);
  });
  const sortedDates = Object.keys(grouped).sort();

  const handleDateClick = (date) => {
    if (selectedDate === date) {
      setSelectedDate(null);
      setSelectedTime(null);
    } else {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  };

  const handleTimeClick = (time, e) => {
    e.preventDefault();
    if (selectedTime === time) setSelectedTime(null);
    else setSelectedTime(time);
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="form-group full-width" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.7)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ddd' }}>
      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '1rem', color: '#333', fontWeight: '600', fontSize: '1.1rem' }}>
        <span>{questionText.split('.')[0]}.</span>
        <span>{questionText.substring(questionText.indexOf('.') + 1).trim()}</span>
      </label>
      
      <input type="hidden" name={questionId} value={selectedTime ? `${selectedDate} om ${selectedTime}` : 'Geen blokje gekozen'} />

      {sortedDates.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic', margin: 0, paddingLeft: '1.5rem' }}>Momenteel geen vrije blokjes beschikbaar via de kalender. Vul een voorkeur in bij vraag 5 of stuur gewoon een berichtje.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {sortedDates.map(date => (
              <button
                key={date}
                type="button"
                onClick={() => handleDateClick(date)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: selectedDate === date ? '2px solid var(--color-primary)' : '1px solid #ccc',
                  background: selectedDate === date ? 'var(--color-primary)' : '#fff',
                  color: selectedDate === date ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: selectedDate === date ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                {formatDate(date)}
              </button>
            ))}
          </div>

          {selectedDate && grouped[selectedDate] && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.8)', borderRadius: '8px', border: '1px solid #eee' }}>
              <span style={{ width: '100%', fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Kies een uur:</span>
              {grouped[selectedDate].sort().map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={(e) => handleTimeClick(time, e)}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '8px',
                    border: selectedTime === time ? '2px solid var(--color-primary)' : '1px solid #ccc',
                    background: selectedTime === time ? 'var(--color-primary)' : '#fff',
                    color: selectedTime === time ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontWeight: selectedTime === time ? 'bold' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div style={{ padding: '0.8rem', background: '#eaf4ea', border: '1px solid #c3e2c3', borderRadius: '8px', color: '#2d5a2d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={18} /> Geselecteerd: {formatDate(selectedDate)} om {selectedTime}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ContactSection = ({ setShowPrivacy }) => {
  const { content, isAdmin, updateMultiple } = useCMS();
  const { variants, viewportProps } = useAnimations();
  const formRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check for booking slot selected
    const formData = new FormData(formRef.current);
    const bookingQ = (content.contactQuestions || []).find(q => q.type === 'booking');
    if (bookingQ) {
      const selected = formData.get(bookingQ.id);
      if (selected && selected !== 'Geen blokje gekozen') {
        const [date, time] = selected.split(' om ');
        if (date && time) {
          const bookedSlots = content.bookedSlots || [];
          const name = formData.get('name') || 'Onbekend';
          const email = formData.get('email') || '';
          const phone = formData.get('phone') || '';
          updateMultiple({ bookedSlots: [...bookedSlots, { date, time, name, email, phone }] });
        }
      }
    }
    
    formRef.current.submit();
  };

  return (
    <section id="contact" className="contact section-padding" style={getSectionStyle('contact', content, { backgroundImage: `url(${content.contactImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', position: 'relative', overflow: 'hidden' })}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(250, 250, 247, 0.6)' }}></div>
      <ThemeEffectOverlay sectionId="contact" content={content} />
      <VideoBackground url={content.customBgVideo_contact} invert={content.invertVideo_contact} />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div className="contact-container" initial="hidden" whileInView="visible" viewport={viewportProps} variants={variants.fadeUp}>
          <h2><EditableText fieldKey="contactTitle" /></h2>
          <div style={{ marginBottom: '1rem' }}><EditableText fieldKey="contactSubtitle" /></div>
          <form ref={formRef} className="contact-form" action="https://api.web3forms.com/submit" method="POST" onSubmit={handleSubmit}>
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
            {(content.contactQuestions || []).map(q => {
              if (!q || !q.question) return null;

              // Format question for better alignment if it starts with a number
              let qNumber = '';
              let qText = q.question;
              if (q.question.match(/^\d+\./)) {
                qNumber = q.question.split('.')[0] + '.';
                qText = q.question.substring(q.question.indexOf('.') + 1).trim();
              }
              
              if (q.type === 'booking') {
                return <BookingWidget key={q.id} questionId={q.id} questionText={q.question} />;
              }
              
              if (q.type === 'checkbox' || q.type === 'radio') {
                const options = (q.options || '').split(',').map(o => o.trim()).filter(o => o);
                return (
                  <div key={q.id} className="form-group full-width" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.8rem', color: '#333', fontWeight: '600' }}>
                      {qNumber && <span>{qNumber}</span>}
                      <span>{qText}</span>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: qNumber ? '1.5rem' : '0' }}>
                      {options.map((opt, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#555', cursor: 'pointer' }}>
                          <input type={q.type} name={q.type === 'checkbox' ? `${q.id}[]` : q.id} value={opt} style={{ width: 'auto', margin: 0 }} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={q.id} className="form-group full-width" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.8rem', color: '#333', fontWeight: '600' }}>
                    {qNumber && <span>{qNumber}</span>}
                    <span>{qText}</span>
                  </label>
                  <div style={{ paddingLeft: qNumber ? '1.5rem' : '0' }}>
                    <input type="text" name={q.id} placeholder="Jouw antwoord" style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                </div>
              );
            })}
            <div className="form-group full-width">
              <textarea name="message" placeholder="Jouw bericht" required></textarea>
            </div>
            <div className="full-width" style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button type="submit" className="btn"><EditableText fieldKey="contactSubmitBtnText" /></button>
              {content.privacyDisclaimer && (
                <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#666' }}>
                  Jouw gegevens worden vertrouwelijk behandeld en nooit gedeeld met derden.{' '}
                  <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}>
                    Privacybeleid
                  </button>
                </div>
              )}
            </div>
          </form>
        </motion.div>
        <RenderBlocks blocks={content.customBlocks_contact} />
      </div>
    </section>
  );
};

const ParallaxSection = ({ id, imageKey, quoteKey }) => {
  const { content, isAdmin } = useCMS();
  const { variants, viewportProps } = useAnimations();

  return (
    <section id={id} className="quote-section" style={{ backgroundImage: `url(${content[imageKey]})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', position: 'relative', padding: '120px 0' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)' }}></div>
      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.blockquote initial="hidden" whileInView="visible" viewport={{ ...viewportProps, amount: 0.3 }} variants={variants.popIn} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)', color: 'white', margin: 0 }}>
          <EditableText fieldKey={quoteKey} />
        </motion.blockquote>
      </div>
    </section>
  );
};

const CustomSection = ({ sectionId }) => {
  const { content } = useCMS();
  const { variants, viewportProps } = useAnimations();

  const blocksKey = `customBlocks_${sectionId}`;
  const blocks = content[blocksKey] || [];

  if (blocks.length > 0) {
    return (
      <section id={sectionId} className="section-padding" style={getSectionStyle(sectionId, content, { position: 'relative', background: '#fff', overflow: 'hidden' })}>
        <ThemeEffectOverlay sectionId={sectionId} content={content} />
        <VideoBackground url={content[`customBgVideo_${sectionId}`]} invert={content[`invertVideo_${sectionId}`]} />
        <div className="container" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '3rem', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}><EditableText fieldKey={`customTitle_${sectionId}`} /></h2>
          <RenderBlocks blocks={blocks} />
        </div>
      </section>
    );
  }

  return (
    <section id={sectionId} className="about section-padding" style={getSectionStyle(sectionId, content, { position: 'relative', background: '#fff', overflow: 'hidden' })}>
      <ThemeEffectOverlay sectionId={sectionId} content={content} />
      <VideoBackground url={content[`customBgVideo_${sectionId}`]} invert={content[`invertVideo_${sectionId}`]} />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div className="about-grid" initial="hidden" whileInView="visible" viewport={viewportProps} variants={variants.staggerContainer}>
          <motion.div className="about-text" variants={variants.slideInLeft}>
            <h2><EditableText fieldKey={`customTitle_${sectionId}`} /></h2>
            <div style={{ marginBottom: '1rem' }}><EditableText fieldKey={`customText_${sectionId}`} multiline /></div>
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
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { content, updateMultiple, isAdmin, showLogin, setShowLogin } = useCMS();

  useEffect(() => {
    if (content.seoTitle) {
      document.title = content.seoTitle;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.content = content.seoTitle;
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.content = content.seoTitle;
    }
    
    if (content.seoDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = content.seoDescription;

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.content = content.seoDescription;
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.content = content.seoDescription;
    }

    if (content.seoRegion) {
      const geoPlacename = document.querySelector('meta[name="geo.placename"]');
      if (geoPlacename) geoPlacename.content = content.seoRegion;
    }

    // Dynamic JSON-LD Schema Update for AI Crawlers
    const schemaScript = document.getElementById('schema-structured-data');
    if (schemaScript) {
      try {
        const schemaData = {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ProfessionalService",
              "@id": "https://oudercoachlindsay.be/#business",
              "name": content.seoTitle || "Oudercoach Lindsay Battiau",
              "image": content.heroImage ? (content.heroImage.startsWith('http') ? content.heroImage : `https://oudercoachlindsay.be${content.heroImage}`) : "/logo.png",
              "description": content.seoDescription || "Professionele oudercoaching en life coaching op maat voor ouders, kinderen, jongeren en gezinnen.",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "BE",
                "addressRegion": content.seoRegion || "Vlaanderen"
              },
              "areaServed": [
                {
                  "@type": "AdministrativeArea",
                  "name": content.seoRegion || "Vlaanderen"
                },
                {
                  "@type": "Country",
                  "name": "België"
                }
              ],
              "knowsAbout": (content.seoKeywords || "Ouderschap, Opvoeding, Gezinsdynamiek, Emotionele begeleiding, Life Coaching").split(',').map(s => s.trim())
            },
            {
              "@type": "Person",
              "@id": "https://oudercoachlindsay.be/#person",
              "name": "Lindsay Battiau",
              "jobTitle": "Oudercoach & Life Coach",
              "description": content.aboutText1 || "Ervaren oudercoach met passie voor verbinding, rust in huis en opvoedingsondersteuning.",
              "worksFor": {
                "@id": "https://oudercoachlindsay.be/#business"
              }
            }
          ]
        };
        schemaScript.textContent = JSON.stringify(schemaData, null, 2);
      } catch (err) {
        console.error("Error updating schema", err);
      }
    }
  }, [content.seoTitle, content.seoDescription, content.seoRegion, content.seoKeywords, content.heroImage, content.aboutText1]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      const sections = document.querySelectorAll('section');
      let current = 'home';
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 300) {
          current = section.getAttribute('id');
        }
      });
      setActiveSection(current);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      document.body.style.paddingLeft = '450px';
      document.body.style.transition = 'padding-left 0.3s ease';
      document.documentElement.style.setProperty('--admin-offset', '450px');
    } else {
      document.body.style.paddingLeft = '0px';
      document.documentElement.style.setProperty('--admin-offset', '0px');
    }
  }, [isAdmin]);

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

  const getMenuLabel = (id) => {
    if (id === 'home') return 'Home';
    if (id === 'over-mij') return 'Over Mij';
    if (id === 'visie') return 'Mijn visie';
    if (id === 'werk-met-mij') return null;
    if (id === 'aanbod') return 'Werk met mij';
    if (id === 'contact' || id.startsWith('parallax')) return null;
    const custom = (content.customSections || []).find(s => s.id === id);
    if (custom) return content[`customTitle_${id}`] || 'Nieuwe Pagina';
    return null;
  };

  return (
    <div className="app">
      {(isAdmin || showLogin) && (
        <Suspense fallback={null}>
          <AdminModals />
        </Suspense>
      )}
      
      {/* NAVIGATIEBALK */}
      <nav className="navbar" style={{ padding: isScrolled ? '0.5rem 0' : '1rem 0' }}>
        <div className="container nav-container">
          
          {/* Mobiele social icons links (zichtbaar zolang menu gesloten is) */}
          <div className="mobile-header-social-icons">
            {!mobileMenuOpen && (
              <div className="mobile-social-wrap">
                {content.instagramLink && (
                  <a href={content.instagramLink} target="_blank" rel="noopener noreferrer" className="nav-social-icon" aria-label="Instagram">
                    <InstagramIcon />
                  </a>
                )}
                {content.facebookLink && (
                  <a href={content.facebookLink} target="_blank" rel="noopener noreferrer" className="nav-social-icon" aria-label="Facebook">
                    <FacebookIcon />
                  </a>
                )}
                {content.linkedinLink && (
                  <a href={content.linkedinLink} target="_blank" rel="noopener noreferrer" className="nav-social-icon" aria-label="LinkedIn">
                    <LinkedinIcon />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
            {content.logoVideo ? (
              <video className="header-logo-video" src={content.logoVideo} autoPlay loop muted playsInline style={{ 
                objectFit: content.logoCrop ? 'cover' : 'contain', 
                aspectRatio: content.logoCrop ? '4/1' : 'auto',
                WebkitMaskImage: content.logoCrop ? 'radial-gradient(ellipse 90% 80% at 50% 50%, black 50%, transparent 100%)' : 'none',
                filter: 'invert(1)', 
                mixBlendMode: 'multiply',
                transform: `scale(${content.logoScaleHeader ?? content.logoScale ?? 1.0}) translateX(${content.logoOffsetXHeader || 0}px)`
              }} />
            ) : (
              <EditableText fieldKey="footerLogo" />
            )}
          </div>
          
          <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {sectionOrder.map((id, index) => {
              const label = getMenuLabel(id);
              if (!label && !isAdmin) return null;
              if (!label && isAdmin && (id === 'contact' || id.startsWith('parallax'))) return null;
              
              if (!label) return null;

              return (
                <div key={id} className={`nav-item ${activeSection === id ? 'is-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <a href={`#${id}`} className={activeSection === id ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>{label}</a>
                </div>
              );
            })}
            
            <div className="desktop-social-icons nav-social-icons">
              {content.instagramLink && (
                <a href={content.instagramLink} target="_blank" rel="noopener noreferrer" className="nav-social-icon" aria-label="Instagram">
                  <InstagramIcon />
                </a>
              )}
              {content.facebookLink && (
                <a href={content.facebookLink} target="_blank" rel="noopener noreferrer" className="nav-social-icon" aria-label="Facebook">
                  <FacebookIcon />
                </a>
              )}
              {content.linkedinLink && (
                <a href={content.linkedinLink} target="_blank" rel="noopener noreferrer" className="nav-social-icon" aria-label="LinkedIn">
                  <LinkedinIcon />
                </a>
              )}
            </div>

            <a href="#contact" className="btn nav-item" style={{ padding: '0.8rem 1.5rem', fontSize: '0.8rem' }} onClick={(e) => {
              setMobileMenuOpen(false);
              if (isAdmin) e.preventDefault();
            }}><EditableText fieldKey="navBtnText" /></a>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
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
            case 'contact': return <ContactSection key={id} setShowPrivacy={setShowPrivacy} />;
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
          <div className="footer-content">
            <div className="footer-logo" style={{ display: 'flex', alignItems: 'center' }}>
              {content.logoVideo ? (
                <video src={content.logoVideo} autoPlay loop muted playsInline style={{ 
                  width: '300px', 
                  height: 'auto', 
                  maxWidth: '100%', 
                  objectFit: content.logoCrop ? 'cover' : 'contain', 
                  aspectRatio: content.logoCrop ? '4/1' : 'auto',
                  WebkitMaskImage: content.logoCrop ? 'radial-gradient(ellipse 90% 80% at 50% 50%, black 50%, transparent 100%)' : 'none',
                  filter: 'contrast(1.2)',
                  mixBlendMode: 'screen',
                  transform: `scale(${content.logoScaleFooter ?? content.logoScale ?? 1.0}) translateX(${content.logoOffsetXFooter || 0}px)`,
                  transformOrigin: 'center center'
                }} />
              ) : (
                <EditableText fieldKey="footerLogo" />
              )}
            </div>
            
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div className="copyright" onDoubleClick={() => setShowLogin(true)} style={{ cursor: 'pointer', userSelect: 'none' }}>
              <EditableText fieldKey="footerCopyright" />
            </div>
            {content.privacyDisclaimer && (
              <div style={{ marginTop: '0.5rem' }}>
                <button onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Privacybeleid</button>
              </div>
            )}
          </div>
        </div>
      </footer>

      {showPrivacy && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }} onClick={() => setShowPrivacy(false)}>
          <div style={{ background: '#111', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPrivacy(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24}/></button>
            <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Privacybeleid</h2>
            <div style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              <EditableText fieldKey="privacyDisclaimer" multiline />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
